import hashlib
import json
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from google.cloud import firestore

from functions.shared.constants import JobStatus, ItemStatus
from functions.shared.logging import logger

def compute_idempotency_key(coordinator_id: str, event_id: str, template_id: str, rows: List[Dict[str, Any]]) -> str:
    """Computes a deterministic hash for idempotency checking"""
    serialized = json.dumps({
        "cid": coordinator_id,
        "eid": event_id,
        "tid": template_id,
        "rowCount": len(rows),
        "firstRow": rows[0] if rows else {},
        "lastRow": rows[-1] if rows else {}
    }, sort_keys=True)
    return hashlib.sha256(serialized.encode('utf-8')).hexdigest()

def create_bulk_generation_job(
    db: firestore.Client,
    coordinator_id: str,
    event_id: str,
    template_id: str,
    template_version: int,
    valid_rows: List[Dict[str, Any]],
    event_name: str
) -> Dict[str, Any]:
    """
    Initializes a bulk generation job and persists all generationItems with status PENDING.
    """
    idempotency_key = compute_idempotency_key(coordinator_id, event_id, template_id, valid_rows)
    
    # Check for existing job with same idempotency key in last 24h
    existing_jobs = db.collection("generationJobs")\
        .where("idempotencyKey", "==", idempotency_key)\
        .limit(1)\
        .stream()
        
    for existing in existing_jobs:
        existing_data = existing.to_dict()
        logger.info(f"Returning existing idempotent job: {existing.id}")
        return {
            "jobId": existing.id,
            "status": existing_data.get("status"),
            "totalRecords": existing_data.get("totalRecords"),
            "processedRecords": existing_data.get("processedRecords"),
            "isDuplicate": True
        }
        
    job_ref = db.collection("generationJobs").document()
    job_id = job_ref.id
    
    total_records = len(valid_rows)
    
    # Batch write generation items in chunks of 450 (Firestore limit is 500 per batch)
    batch_size = 450
    for chunk_start in range(0, total_records, batch_size):
        chunk_rows = valid_rows[chunk_start:chunk_start + batch_size]
        batch = db.batch()
        
        for idx, r in enumerate(chunk_rows, start=chunk_start + 1):
            item_id = f"{job_id}_{idx}"
            item_ref = db.collection("generationItems").document(item_id)
            batch.set(item_ref, {
                "itemId": item_id,
                "jobId": job_id,
                "rowNumber": r.get("_row_number", idx),
                "rowData": {
                    "name": r.get("name", ""),
                    "email": r.get("email", ""),
                    "course": r.get("course", ""),
                    "event": event_name or r.get("event", ""),
                    "date": r.get("date", ""),
                    "duration": r.get("duration", "")
                },
                "certificateId": None,
                "recipientEmail": r.get("email", ""),
                "status": ItemStatus.PENDING.value,
                "errorCode": None,
                "errorMessage": None,
                "attempts": 0,
                "processedAt": None
            })
            
        batch.commit()
        
    # Write parent job document
    job_ref.set({
        "jobId": job_id,
        "idempotencyKey": idempotency_key,
        "coordinatorId": coordinator_id,
        "eventId": event_id,
        "eventName": event_name,
        "templateId": template_id,
        "templateVersion": template_version,
        "totalRecords": total_records,
        "processedRecords": 0,
        "successfulRecords": 0,
        "failedRecords": 0,
        "status": JobStatus.PENDING.value,
        "createdAt": firestore.SERVER_TIMESTAMP,
        "startedAt": None,
        "completedAt": None,
        "updatedAt": firestore.SERVER_TIMESTAMP
    })
    
    logger.info(f"Created bulk generation job {job_id} with {total_records} items", job_id=job_id, user_id=coordinator_id)
    
    return {
        "jobId": job_id,
        "totalRecords": total_records,
        "processedRecords": 0,
        "status": JobStatus.PENDING.value,
        "isDuplicate": False
    }
