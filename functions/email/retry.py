from typing import Dict, Any, List, Optional
from google.cloud import firestore

from functions.shared.logging import logger
from functions.shared.constants import ItemStatus, JobStatus
from functions.certificates.service import issue_single_certificate_core

def retry_failed_job_items(
    db: firestore.Client,
    job_id: str,
    coordinator_id: str
) -> Dict[str, Any]:
    """
    Retries only the failed records of a specific generation job.
    """
    job_ref = db.collection("generationJobs").document(job_id)
    job_doc = job_ref.get()
    
    if not job_doc.exists:
        raise ValueError("Job not found")
        
    job_data = job_doc.to_dict()
    if job_data.get("coordinatorId") != coordinator_id:
        raise PermissionError("Unauthorized to retry this job")
        
    template_id = job_data["templateId"]
    template_version = job_data.get("templateVersion", 1)
    event_id = job_data.get("eventId")
    
    # Query only failed items
    failed_items_query = db.collection("generationItems")\
        .where("jobId", "==", job_id)\
        .where("status", "==", ItemStatus.FAILED.value)\
        .stream()
        
    retried_count = 0
    new_success_count = 0
    new_fail_count = 0
    
    for item_doc in failed_items_query:
        retried_count += 1
        item_data = item_doc.to_dict()
        row_data = item_data.get("rowData", {})
        
        try:
            cert_res = issue_single_certificate_core(
                db=db,
                coordinator_id=coordinator_id,
                name=row_data.get("name", ""),
                email=row_data.get("email", ""),
                course=row_data.get("course", ""),
                event=row_data.get("event", ""),
                date=row_data.get("date", ""),
                duration=row_data.get("duration", ""),
                template_id=template_id,
                template_version=template_version,
                event_id=event_id,
                job_id=job_id,
                send_email=True
            )
            
            item_doc.reference.update({
                "status": ItemStatus.SUCCESS.value,
                "certificateId": cert_res["certificateId"],
                "errorCode": None,
                "errorMessage": None,
                "processedAt": firestore.SERVER_TIMESTAMP
            })
            new_success_count += 1
        except Exception as err:
            new_fail_count += 1
            item_doc.reference.update({
                "attempts": (item_data.get("attempts", 0) + 1),
                "errorCode": "RETRY_FAILED",
                "errorMessage": str(err),
                "processedAt": firestore.SERVER_TIMESTAMP
            })
            
    # Update Job stats
    current_success = job_data.get("successfulRecords", 0) + new_success_count
    current_failed = max(0, job_data.get("failedRecords", 0) - new_success_count)
    
    job_status = JobStatus.COMPLETED.value if current_failed == 0 else JobStatus.PARTIALLY_FAILED.value
    job_ref.update({
        "successfulRecords": current_success,
        "failedRecords": current_failed,
        "status": job_status,
        "updatedAt": firestore.SERVER_TIMESTAMP
    })
    
    return {
        "jobId": job_id,
        "retriedCount": retried_count,
        "newSuccessCount": new_success_count,
        "newFailCount": new_fail_count,
        "totalSuccessful": current_success,
        "totalFailed": current_failed,
        "status": job_status
    }
