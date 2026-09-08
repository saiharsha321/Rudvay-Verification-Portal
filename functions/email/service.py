import io
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from google.cloud import firestore

from functions.email.smtp import send_certificate_email_smtp
from functions.shared.logging import logger
from functions.shared.constants import EmailStatus

def dispatch_certificate_email(
    db: Optional[firestore.Client],
    certificate_id: str,
    recipient_email: str,
    recipient_name: str,
    course_name: str,
    verification_url: str,
    pdf_stream: io.BytesIO,
    job_id: Optional[str] = None,
    smtp_override: Optional[Dict[str, Any]] = None,
    max_retries: int = 3
) -> bool:
    """
    Sends email with retries and records log in Firestore.
    """
    attempts = 0
    last_error: Optional[str] = None
    success = False
    
    while attempts < max_retries and not success:
        attempts += 1
        try:
            send_certificate_email_smtp(
                recipient_email=recipient_email,
                recipient_name=recipient_name,
                course_name=course_name,
                certificate_id=certificate_id,
                verification_url=verification_url,
                pdf_stream=pdf_stream,
                smtp_override=smtp_override
            )
            success = True
            logger.info(f"Email successfully delivered to {recipient_email}", certificate_id=certificate_id, job_id=job_id)
        except Exception as e:
            last_error = str(e)
            logger.warning(
                f"Email attempt {attempts}/{max_retries} failed for {recipient_email}: {str(e)}",
                certificate_id=certificate_id,
                job_id=job_id
            )
            
    # Record in emailLogs if db is provided
    if db is not None:
        try:
            log_ref = db.collection("emailLogs").document()
            log_ref.set({
                "emailLogId": log_ref.id,
                "certificateId": certificate_id,
                "jobId": job_id,
                "recipientEmail": recipient_email,
                "status": EmailStatus.SENT.value if success else EmailStatus.FAILED.value,
                "attempts": attempts,
                "lastError": last_error,
                "sentAt": firestore.SERVER_TIMESTAMP if success else None,
                "createdAt": firestore.SERVER_TIMESTAMP,
            })
        except Exception as log_err:
            logger.error("Failed to write to emailLogs", extra={"error": str(log_err)})
            
    return success
