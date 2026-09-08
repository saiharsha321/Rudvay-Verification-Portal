from datetime import datetime, timezone
from typing import Dict, Any, Optional
from google.cloud import firestore

from functions.shared.constants import JobStatus, ItemStatus
from functions.shared.logging import logger
from functions.certificates.service import issue_single_certificate_core

def process_job_chunk(
    db: firestore.Client,
    job_id: str,
    chunk_size: int = 25
) -> Dict[str, Any]:
    """
    Serverless-resilient worker:
    Processes up to `chunk_size` pending items for the job.
    Updates row items atomically and increments job progress.
    Can be called repeatedly until all items are completed.
    """
    job_ref = db.collection("generationJobs").document(job_id)
    job_doc = job_ref.get()
    
    if not job_doc.exists:
        raise ValueError(f"Job {job_id} not found")
        
    job_data = job_doc.to_dict()
    coordinator_id = job_data["coordinatorId"]
    template_id = job_data["templateId"]
    template_version = job_data.get("templateVersion", 1)
    event_id = job_data.get("eventId")
    event_name = job_data.get("eventName", "")
    
    if job_data.get("status") == JobStatus.PENDING.value:
        job_ref.update({
            "status": JobStatus.PROCESSING.value,
            "startedAt": firestore.SERVER_TIMESTAMP,
            "updatedAt": firestore.SERVER_TIMESTAMP
        })
        
    # Fetch next batch of PENDING items
    pending_items_query = db.collection("generationItems")\
        .where("jobId", "==", job_id)\
        .where("status", "==", ItemStatus.PENDING.value)\
        .limit(chunk_size)\
        .stream()
        
    items_processed = 0
    chunk_success = 0
    chunk_failed = 0
    
    for item_doc in pending_items_query:
        items_processed += 1
        item_data = item_doc.to_dict()
        row_data = item_data.get("rowData", {})
        
        try:
            cert_res = issue_single_certificate_core(
                db=db,
                coordinator_id=coordinator_id,
                name=row_data.get("name", ""),
                email=row_data.get("email", ""),
                course=row_data.get("course", ""),
                event=event_name or row_data.get("event", ""),
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
                "attempts": 1,
                "processedAt": firestore.SERVER_TIMESTAMP
            })
            chunk_success += 1
        except Exception as err:
            chunk_failed += 1
            logger.error(f"Error processing item in job {job_id}: {str(err)}", job_id=job_id)
            item_doc.reference.update({
                "status": ItemStatus.FAILED.value,
                "errorCode": "PROCESSING_ERROR",
                "errorMessage": str(err),
                "attempts": 1,
                "processedAt": firestore.SERVER_TIMESTAMP
            })
            
    # Refresh stats on parent job
    new_processed = job_data.get("processedRecords", 0) + items_processed
    new_success = job_data.get("successfulRecords", 0) + chunk_success
    new_failed = job_data.get("failedRecords", 0) + chunk_failed
    total = job_data.get("totalRecords", 0)
    
    is_done = new_processed >= total or items_processed == 0
    new_status = job_data.get("status")
    
    if is_done:
        new_status = JobStatus.COMPLETED.value if new_failed == 0 else JobStatus.PARTIALLY_FAILED.value
        
    job_ref.update({
        "processedRecords": new_processed,
        "successfulRecords": new_success,
        "failedRecords": new_failed,
        "status": new_status,
        "completedAt": firestore.SERVER_TIMESTAMP if is_done else None,
        "updatedAt": firestore.SERVER_TIMESTAMP
    })
    
    return {
        "jobId": job_id,
        "chunkProcessed": items_processed,
        "chunkSuccess": chunk_success,
        "chunkFailed": chunk_failed,
        "totalProcessed": new_processed,
        "total": total,
        "isDone": is_done,
        "status": new_status
    }
