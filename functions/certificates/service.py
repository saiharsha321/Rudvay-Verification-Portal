import io
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from google.cloud import firestore

from functions.certificates.ids import generate_unique_certificate_id, generate_verification_code
from functions.certificates.qr import build_verification_url
from functions.certificates.renderer import render_certificate_pdf
from functions.templates.service import get_template_version_design
from functions.email.service import dispatch_certificate_email
from functions.shared.constants import CertificateStatus
from functions.shared.errors import CertificateNotFoundError, CertificateRevokedError
from functions.shared.logging import logger

def issue_single_certificate_core(
    db: firestore.Client,
    coordinator_id: str,
    name: str,
    email: str,
    course: str,
    event: str,
    date: str,
    duration: str,
    template_id: str,
    template_version: Optional[int] = None,
    event_id: Optional[str] = None,
    job_id: Optional[str] = None,
    send_email: bool = True
) -> Dict[str, Any]:
    """
    Core atomic certificate issuance pipeline:
    1. Generates unique cryptographically secure ID
    2. Builds verification URL
    3. Fetches template design JSON version
    4. Renders PDF strictly in-memory
    5. Dispatches email attachment
    6. Commits metadata to Firestore
    7. Cleans up memory
    """
    # 1. Unique ID
    certificate_id = generate_unique_certificate_id(db=db)
    verification_code = generate_verification_code()
    verification_url = build_verification_url(certificate_id)
    
    # 2. Template design
    design = get_template_version_design(db, template_id, template_version)
    actual_version = template_version or 1
    
    # 3. Context
    context = {
        "certificateId": certificate_id,
        "recipientName": name,
        "recipientEmail": email,
        "programName": course,
        "eventName": event,
        "issueDate": date,
        "duration": duration or "",
    }
    
    # 4. In-Memory PDF Rendering
    pdf_stream = render_certificate_pdf(design, context, verification_url)
    
    email_sent = False
    try:
        # 5. SMTP Email Dispatch
        if send_email:
            email_sent = dispatch_certificate_email(
                db=db,
                certificate_id=certificate_id,
                recipient_email=email,
                recipient_name=name,
                course_name=course,
                verification_url=verification_url,
                pdf_stream=pdf_stream,
                job_id=job_id
            )
    finally:
        # Release PDF memory immediately
        pdf_stream.close()
        
    # 6. Commit Certificate to Firestore
    cert_data = {
        "certificateId": certificate_id,
        "verificationCode": verification_code,
        "eventId": event_id or "",
        "coordinatorId": coordinator_id,
        "recipientName": name,
        "recipientEmail": email,
        "programName": course,
        "eventName": event,
        "issueDate": date,
        "duration": duration or "",
        "templateId": template_id,
        "templateVersion": actual_version,
        "status": CertificateStatus.VALID.value,
        "revokedReason": None,
        "revokedAt": None,
        "emailSent": email_sent,
        "createdAt": firestore.SERVER_TIMESTAMP,
        "updatedAt": firestore.SERVER_TIMESTAMP,
    }
    
    db.collection("certificates").document(certificate_id).set(cert_data)
    logger.info(f"Certificate issued: {certificate_id} for {email}", certificate_id=certificate_id, user_id=coordinator_id)
    
    return {
        "certificateId": certificate_id,
        "verificationCode": verification_code,
        "verificationUrl": verification_url,
        "status": CertificateStatus.VALID.value,
        "emailSent": email_sent
    }

def revoke_certificate(
    db: firestore.Client,
    certificate_id: str,
    reason: str,
    actor_uid: str
) -> Dict[str, Any]:
    """
    Revokes an issued certificate.
    """
    cert_ref = db.collection("certificates").document(certificate_id)
    doc = cert_ref.get()
    
    if not doc.exists:
        raise CertificateNotFoundError(f"Certificate {certificate_id} not found")
        
    cert_data = doc.to_dict()
    if cert_data.get("status") == CertificateStatus.REVOKED.value:
        return {"certificateId": certificate_id, "status": CertificateStatus.REVOKED.value, "alreadyRevoked": True}
        
    cert_ref.update({
        "status": CertificateStatus.REVOKED.value,
        "revokedReason": reason,
        "revokedAt": firestore.SERVER_TIMESTAMP,
        "revokedBy": actor_uid,
        "updatedAt": firestore.SERVER_TIMESTAMP,
    })
    
    logger.info(f"Certificate revoked: {certificate_id} - Reason: {reason}", certificate_id=certificate_id, user_id=actor_uid)
    return {
        "certificateId": certificate_id,
        "status": CertificateStatus.REVOKED.value,
        "revokedReason": reason
    }
