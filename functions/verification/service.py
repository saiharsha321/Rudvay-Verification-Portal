import io
from typing import Dict, Any, Optional
from google.cloud import firestore

from functions.certificates.qr import build_verification_url
from functions.certificates.renderer import render_certificate_pdf
from functions.templates.service import get_template_version_design
from functions.shared.models import PublicCertificateResponse
from functions.shared.errors import CertificateNotFoundError
from functions.shared.logging import logger

def verify_certificate_public(
    db: firestore.Client,
    certificate_id: str,
    verification_code: Optional[str] = None
) -> PublicCertificateResponse:
    """
    Public-safe verification lookup.
    Never exposes recipient email, coordinator ID, or internal metadata.
    """
    clean_id = certificate_id.strip()
    doc_ref = db.collection("certificates").document(clean_id)
    doc = doc_ref.get()
    
    if not doc.exists:
        logger.warning(f"Verification attempt for non-existent ID: {clean_id}")
        raise CertificateNotFoundError(f"Certificate with ID '{clean_id}' was not found.")
        
    data = doc.to_dict()
    
    # If a verification code was supplied, validate it
    if verification_code and verification_code.strip():
        actual_code = data.get("verificationCode", "")
        if actual_code.upper() != verification_code.strip().upper():
            raise CertificateNotFoundError("Invalid verification code for this certificate ID.")
            
    ver_url = build_verification_url(clean_id)
    
    return PublicCertificateResponse(
        certificateId=data["certificateId"],
        recipientName=data.get("recipientName", ""),
        programName=data.get("programName", ""),
        eventName=data.get("eventName", ""),
        issueDate=str(data.get("issueDate", "")),
        duration=str(data.get("duration", "")),
        status=data.get("status", "VALID"),
        issuer="Rudvay Tech",
        verificationUrl=ver_url
    )

def regenerate_certificate_pdf_on_demand(
    db: firestore.Client,
    certificate_id: str
) -> io.BytesIO:
    """
    On-Demand PDF regeneration (Section 38):
    Does not fetch from any stored file service.
    Renders pure in-memory PDF from the immutable template version and certificate metadata.
    """
    clean_id = certificate_id.strip()
    doc_ref = db.collection("certificates").document(clean_id)
    doc = doc_ref.get()
    
    if not doc.exists:
        raise CertificateNotFoundError(f"Certificate '{clean_id}' not found.")
        
    data = doc.to_dict()
    template_id = data.get("templateId")
    template_version = data.get("templateVersion", 1)
    
    design = get_template_version_design(db, template_id, template_version)
    verification_url = build_verification_url(clean_id)
    
    context = {
        "certificateId": clean_id,
        "recipientName": data.get("recipientName", ""),
        "recipientEmail": data.get("recipientEmail", ""),
        "programName": data.get("programName", ""),
        "eventName": data.get("eventName", ""),
        "issueDate": data.get("issueDate", ""),
        "duration": data.get("duration", ""),
    }
    
    return render_certificate_pdf(design, context, verification_url)
