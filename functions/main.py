import io
from typing import Optional, Dict, Any, List
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form, Response, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from google.cloud import firestore

from functions.config import settings
from functions.shared.constants import UserRole, AuditAction, CertificateStatus
from functions.shared.errors import AppError, NotFoundError, UnauthorizedError, ForbiddenError
from functions.shared.logging import logger
from functions.shared.models import (
    PublicCertificateResponse,
    SingleCertificateRequest,
    SmtpConfigDTO,
    SmtpTestRequest,
    RevokeCertificateRequest
)
from functions.auth.service import (
    initialize_firebase_admin,
    get_firestore_client,
    create_coordinator_user,
    toggle_coordinator_status
)
from functions.auth.middleware import (
    verify_bearer_token,
    require_admin,
    require_coordinator_or_admin
)
from functions.templates.schema import CreateTemplateRequest, UpdateTemplateRequest, TemplateDesignJSON
from functions.templates.service import (
    create_template,
    update_template_version,
    get_template_version_design
)
from functions.certificates.service import issue_single_certificate_core, revoke_certificate
from functions.certificates.renderer import render_certificate_pdf
from functions.certificates.qr import build_verification_url
from functions.verification.service import verify_certificate_public, regenerate_certificate_pdf_on_demand
from functions.excel.parser import parse_csv_or_excel
from functions.excel.validator import validate_mapped_rows
from functions.excel.mapper import auto_detect_column_mapping
from functions.email.smtp import test_smtp_connection
from functions.email.retry import retry_failed_job_items
from functions.jobs.service import create_bulk_generation_job
from functions.jobs.worker import process_job_chunk
from functions.audit.service import record_audit_log

# Initialize Firebase Admin
initialize_firebase_admin()

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Production-grade serverless certificate generation and verification platform",
    version="1.0.0"
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    return get_firestore_client()

# ============================================================
# PUBLIC VERIFICATION ENDPOINTS
# ============================================================

@app.get("/api/v1/verify/{certificate_id}", response_model=PublicCertificateResponse)
def verify_certificate_endpoint(
    certificate_id: str,
    code: Optional[str] = Query(None, description="Optional verification code"),
    db: firestore.Client = Depends(get_db)
):
    """
    Public verification endpoint.
    Returns only public-safe fields without leaking sensitive data.
    """
    try:
        return verify_certificate_public(db, certificate_id, code)
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)

@app.get("/api/v1/verify/{certificate_id}/download")
def download_certificate_endpoint(
    certificate_id: str,
    db: firestore.Client = Depends(get_db)
):
    """
    On-Demand PDF regeneration (Section 38).
    Generates the certificate PDF strictly in-memory from immutable metadata and streams it to the user.
    """
    try:
        pdf_stream = regenerate_certificate_pdf_on_demand(db, certificate_id)
        return StreamingResponse(
            pdf_stream,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="Rudvay_Tech_{certificate_id}.pdf"',
                "Cache-Control": "no-cache, no-store, must-revalidate"
            }
        )
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)

# ============================================================
# ADMIN ENDPOINTS
# ============================================================

@app.post("/api/v1/admin/coordinators")
def create_coordinator_endpoint(
    payload: Dict[str, Any],
    admin_user: Dict[str, Any] = Depends(require_admin),
    db: firestore.Client = Depends(get_db)
):
    email = payload.get("email")
    password = payload.get("password")
    name = payload.get("name")
    
    if not (email and password and name):
        raise HTTPException(status_code=400, detail="Missing required fields (email, password, name)")
        
    coord = create_coordinator_user(db, email, password, name, admin_user["uid"])
    record_audit_log(
        db, admin_user["uid"], "ADMIN", AuditAction.CREATE_COORDINATOR,
        "USER", coord["uid"], {"email": email, "name": name}
    )
    return coord

@app.get("/api/v1/admin/coordinators")
def list_coordinators_endpoint(
    admin_user: Dict[str, Any] = Depends(require_admin),
    db: firestore.Client = Depends(get_db)
):
    docs = db.collection("coordinators").stream()
    return [d.to_dict() for d in docs]

@app.patch("/api/v1/admin/coordinators/{uid}")
def toggle_coordinator_endpoint(
    uid: str,
    payload: Dict[str, bool],
    admin_user: Dict[str, Any] = Depends(require_admin),
    db: firestore.Client = Depends(get_db)
):
    active = payload.get("active", True)
    res = toggle_coordinator_status(db, uid, active, admin_user["uid"])
    record_audit_log(
        db, admin_user["uid"], "ADMIN",
        AuditAction.ENABLE_COORDINATOR if active else AuditAction.DISABLE_COORDINATOR,
        "USER", uid, {"active": active}
    )
    return res

@app.post("/api/v1/admin/smtp/test")
def test_smtp_endpoint(
    data: SmtpTestRequest,
    admin_user: Dict[str, Any] = Depends(require_admin)
):
    try:
        test_smtp_connection(
            host=data.host,
            port=data.port,
            username=data.username,
            password=data.password,
            use_tls=data.useTls
        )
        return {"success": True, "message": "SMTP connection handshake successful"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.put("/api/v1/admin/smtp/config")
def update_smtp_config_endpoint(
    data: SmtpConfigDTO,
    admin_user: Dict[str, Any] = Depends(require_admin),
    db: firestore.Client = Depends(get_db)
):
    config_dict = data.model_dump()
    # If password is provided, save in backend-only systemSettings
    db.collection("systemSettings").document("smtp").set(config_dict, merge=True)
    record_audit_log(
        db, admin_user["uid"], "ADMIN", AuditAction.UPDATE_SMTP,
        "SYSTEM_SETTINGS", "smtp", {"host": data.host, "port": data.port, "fromEmail": data.fromEmail}
    )
    return {"success": True, "message": "SMTP configuration updated successfully"}

@app.post("/api/v1/admin/certificates/{certificate_id}/revoke")
def revoke_certificate_endpoint(
    certificate_id: str,
    data: RevokeCertificateRequest,
    admin_user: Dict[str, Any] = Depends(require_admin),
    db: firestore.Client = Depends(get_db)
):
    try:
        res = revoke_certificate(db, certificate_id, data.reason, admin_user["uid"])
        record_audit_log(
            db, admin_user["uid"], "ADMIN", AuditAction.REVOKE_CERTIFICATE,
            "CERTIFICATE", certificate_id, {"reason": data.reason}
        )
        return res
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)

@app.get("/api/v1/admin/metrics")
def get_admin_metrics_endpoint(
    admin_user: Dict[str, Any] = Depends(require_admin),
    db: firestore.Client = Depends(get_db)
):
    # Aggregated metrics for Admin Dashboard
    certs_query = db.collection("certificates").stream()
    total_certs = 0
    valid_certs = 0
    revoked_certs = 0
    
    for c in certs_query:
        total_certs += 1
        st = c.to_dict().get("status")
        if st == CertificateStatus.VALID.value:
            valid_certs += 1
        elif st == CertificateStatus.REVOKED.value:
            revoked_certs += 1
            
    coord_count = len(list(db.collection("coordinators").stream()))
    jobs_count = len(list(db.collection("generationJobs").stream()))
    
    return {
        "totalCertificates": total_certs,
        "validCertificates": valid_certs,
        "revokedCertificates": revoked_certs,
        "totalCoordinators": coord_count,
        "totalJobs": jobs_count
    }

@app.get("/api/v1/admin/audit-logs")
def get_audit_logs_endpoint(
    limit: int = Query(50, le=200),
    admin_user: Dict[str, Any] = Depends(require_admin),
    db: firestore.Client = Depends(get_db)
):
    docs = db.collection("auditLogs").order_by("timestamp", direction=firestore.Query.DESCENDING).limit(limit).stream()
    logs = []
    for d in docs:
        item = d.to_dict()
        if item.get("timestamp"):
            item["timestamp"] = item["timestamp"].isoformat() if hasattr(item["timestamp"], "isoformat") else str(item["timestamp"])
        logs.append(item)
    return logs

# ============================================================
# COORDINATOR & EVENT ENDPOINTS
# ============================================================

@app.post("/api/v1/events")
def create_event_endpoint(
    payload: Dict[str, Any],
    user: Dict[str, Any] = Depends(require_coordinator_or_admin),
    db: firestore.Client = Depends(get_db)
):
    event_ref = db.collection("events").document()
    event_data = {
        "eventId": event_ref.id,
        "coordinatorId": user["uid"],
        "name": payload.get("name", ""),
        "description": payload.get("description", ""),
        "date": payload.get("date", ""),
        "duration": payload.get("duration", ""),
        "status": "ACTIVE",
        "createdAt": firestore.SERVER_TIMESTAMP,
        "updatedAt": firestore.SERVER_TIMESTAMP
    }
    event_ref.set(event_data)
    record_audit_log(
        db, user["uid"], user.get("role", "COORDINATOR"), AuditAction.CREATE_EVENT,
        "EVENT", event_ref.id, {"name": payload.get("name")}
    )
    return event_data

@app.get("/api/v1/events")
def list_events_endpoint(
    user: Dict[str, Any] = Depends(require_coordinator_or_admin),
    db: firestore.Client = Depends(get_db)
):
    is_admin = user.get("admin") is True or user.get("role") == "ADMIN"
    if is_admin:
        docs = db.collection("events").stream()
    else:
        docs = db.collection("events").where("coordinatorId", "==", user["uid"]).stream()
    return [d.to_dict() for d in docs]

# ============================================================
# TEMPLATE DESIGNER ENDPOINTS
# ============================================================

@app.post("/api/v1/templates")
def create_template_endpoint(
    data: CreateTemplateRequest,
    user: Dict[str, Any] = Depends(require_coordinator_or_admin),
    db: firestore.Client = Depends(get_db)
):
    res = create_template(db, user["uid"], data)
    record_audit_log(
        db, user["uid"], user.get("role", "COORDINATOR"), AuditAction.CREATE_TEMPLATE,
        "TEMPLATE", res["templateId"], {"name": data.name, "version": 1}
    )
    return res

@app.put("/api/v1/templates/{template_id}")
def update_template_endpoint(
    template_id: str,
    data: UpdateTemplateRequest,
    user: Dict[str, Any] = Depends(require_coordinator_or_admin),
    db: firestore.Client = Depends(get_db)
):
    is_admin = user.get("admin") is True or user.get("role") == "ADMIN"
    res = update_template_version(db, template_id, user["uid"], is_admin, data)
    record_audit_log(
        db, user["uid"], user.get("role", "COORDINATOR"), AuditAction.UPDATE_TEMPLATE,
        "TEMPLATE", template_id, {"version": res["version"]}
    )
    return res

@app.get("/api/v1/templates/{template_id}")
def get_template_endpoint(
    template_id: str,
    version: Optional[int] = Query(None),
    user: Dict[str, Any] = Depends(require_coordinator_or_admin),
    db: firestore.Client = Depends(get_db)
):
    t_doc = db.collection("templates").document(template_id).get()
    if not t_doc.exists:
        raise HTTPException(status_code=404, detail="Template not found")
        
    t_data = t_doc.to_dict()
    design = get_template_version_design(db, template_id, version)
    return {
        **t_data,
        "designJson": design.model_dump()
    }

@app.get("/api/v1/templates")
def list_templates_endpoint(
    user: Dict[str, Any] = Depends(require_coordinator_or_admin),
    db: firestore.Client = Depends(get_db)
):
    is_admin = user.get("admin") is True or user.get("role") == "ADMIN"
    if is_admin:
        docs = db.collection("templates").stream()
    else:
        docs = db.collection("templates").where("ownerId", "==", user["uid"]).stream()
    return [d.to_dict() for d in docs]

# ============================================================
# EXCEL IMPORT & VALIDATION ENDPOINTS
# ============================================================

@app.post("/api/v1/excel/parse-headers")
async def parse_excel_headers_endpoint(
    file: UploadFile = File(...),
    user: Dict[str, Any] = Depends(require_coordinator_or_admin)
):
    file_bytes = await file.read()
    headers, rows = parse_csv_or_excel(file_bytes, file.filename or "file.xlsx")
    suggested_mapping = auto_detect_column_mapping(headers)
    
    return {
        "headers": headers,
        "sampleRows": rows[:5],
        "totalRowCount": len(rows),
        "suggestedMapping": suggested_mapping
    }

@app.post("/api/v1/excel/validate")
async def validate_excel_endpoint(
    file: UploadFile = File(...),
    mappingJson: str = Form(...),
    user: Dict[str, Any] = Depends(require_coordinator_or_admin)
):
    import json
    column_mapping = json.loads(mappingJson)
    file_bytes = await file.read()
    headers, rows = parse_csv_or_excel(file_bytes, file.filename or "file.xlsx")
    report = validate_mapped_rows(rows, column_mapping)
    return report.model_dump()

# ============================================================
# CERTIFICATE ISSUANCE & PREVIEW
# ============================================================

@app.post("/api/v1/certificates/preview")
def preview_certificate_endpoint(
    data: SingleCertificateRequest,
    user: Dict[str, Any] = Depends(require_coordinator_or_admin),
    db: firestore.Client = Depends(get_db)
):
    """
    Renders preview PDF strictly in memory and streams to browser without saving to Firestore.
    """
    design = get_template_version_design(db, data.templateId, data.templateVersion)
    dummy_id = "RT-2026-PREVIEW"
    dummy_url = build_verification_url(dummy_id)
    
    context = {
        "certificateId": dummy_id,
        "recipientName": data.name,
        "recipientEmail": data.email,
        "programName": data.course,
        "eventName": data.event,
        "issueDate": data.date,
        "duration": data.duration,
    }
    
    pdf_stream = render_certificate_pdf(design, context, dummy_url)
    return StreamingResponse(
        pdf_stream,
        media_type="application/pdf",
        headers={"Content-Disposition": "inline; filename=certificate_preview.pdf"}
    )

@app.post("/api/v1/certificates/single")
def issue_single_certificate_endpoint(
    data: SingleCertificateRequest,
    user: Dict[str, Any] = Depends(require_coordinator_or_admin),
    db: firestore.Client = Depends(get_db)
):
    try:
        res = issue_single_certificate_core(
            db=db,
            coordinator_id=user["uid"],
            name=data.name,
            email=str(data.email),
            course=data.course,
            event=data.event,
            date=data.date,
            duration=data.duration or "",
            template_id=data.templateId,
            template_version=data.templateVersion,
            event_id=data.eventId,
            send_email=data.sendEmail
        )
        record_audit_log(
            db, user["uid"], user.get("role", "COORDINATOR"), AuditAction.GENERATE_CERTIFICATE,
            "CERTIFICATE", res["certificateId"], {"email": str(data.email), "course": data.course}
        )
        return res
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)

# ============================================================
# BULK GENERATION JOBS & RETRY
# ============================================================

@app.post("/api/v1/jobs/bulk")
def create_bulk_job_endpoint(
    payload: Dict[str, Any],
    user: Dict[str, Any] = Depends(require_coordinator_or_admin),
    db: firestore.Client = Depends(get_db)
):
    event_id = payload.get("eventId", "")
    template_id = payload.get("templateId", "")
    template_version = payload.get("templateVersion", 1)
    valid_rows = payload.get("validRows", [])
    event_name = payload.get("eventName", "")
    
    if not (template_id and valid_rows):
        raise HTTPException(status_code=400, detail="Missing templateId or validRows")
        
    res = create_bulk_generation_job(
        db=db,
        coordinator_id=user["uid"],
        event_id=event_id,
        template_id=template_id,
        template_version=template_version,
        valid_rows=valid_rows,
        event_name=event_name
    )
    record_audit_log(
        db, user["uid"], user.get("role", "COORDINATOR"), AuditAction.START_GENERATION,
        "JOB", res["jobId"], {"totalRecords": res["totalRecords"]}
    )
    return res

@app.post("/api/v1/jobs/{job_id}/process-chunk")
def process_job_chunk_endpoint(
    job_id: str,
    chunk_size: int = Query(25, le=100),
    user: Dict[str, Any] = Depends(require_coordinator_or_admin),
    db: firestore.Client = Depends(get_db)
):
    try:
        return process_job_chunk(db, job_id, chunk_size=chunk_size)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/jobs/{job_id}/retry-failed")
def retry_failed_job_endpoint(
    job_id: str,
    user: Dict[str, Any] = Depends(require_coordinator_or_admin),
    db: firestore.Client = Depends(get_db)
):
    try:
        res = retry_failed_job_items(db, job_id, user["uid"])
        record_audit_log(
            db, user["uid"], user.get("role", "COORDINATOR"), AuditAction.RETRY_EMAIL,
            "JOB", job_id, {"retriedCount": res["retriedCount"]}
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/jobs/{job_id}")
def get_job_status_endpoint(
    job_id: str,
    user: Dict[str, Any] = Depends(require_coordinator_or_admin),
    db: firestore.Client = Depends(get_db)
):
    job_doc = db.collection("generationJobs").document(job_id).get()
    if not job_doc.exists:
        raise HTTPException(status_code=404, detail="Job not found")
        
    job_data = job_doc.to_dict()
    # Include item count breakdown
    items_docs = db.collection("generationItems").where("jobId", "==", job_id).stream()
    items = [d.to_dict() for d in items_docs]
    
    return {
        **job_data,
        "items": items
    }
