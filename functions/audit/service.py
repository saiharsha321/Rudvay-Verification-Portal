import hashlib
from typing import Dict, Any, Optional
from google.cloud import firestore

from functions.shared.constants import AuditAction
from functions.shared.logging import logger

def record_audit_log(
    db: firestore.Client,
    actor_uid: str,
    actor_role: str,
    action: AuditAction,
    target_type: str,
    target_id: str,
    metadata: Optional[Dict[str, Any]] = None,
    client_ip: Optional[str] = None
) -> str:
    """
    Writes an immutable structured audit log entry to Firestore.
    Never logs raw passwords or credentials. Hashes client IP for privacy.
    """
    ip_hash = None
    if client_ip:
        ip_hash = hashlib.sha256(client_ip.encode('utf-8')).hexdigest()[:16]
        
    log_ref = db.collection("auditLogs").document()
    
    clean_meta = {}
    if metadata:
        for k, v in metadata.items():
            if "password" in k.lower() or "secret" in k.lower() or "token" in k.lower():
                clean_meta[k] = "[REDACTED]"
            else:
                clean_meta[k] = v
                
    log_data = {
        "auditLogId": log_ref.id,
        "actorUid": actor_uid,
        "actorRole": actor_role,
        "action": action.value if hasattr(action, "value") else str(action),
        "targetType": target_type,
        "targetId": target_id,
        "metadata": clean_meta,
        "ipHash": ip_hash,
        "timestamp": firestore.SERVER_TIMESTAMP
    }
    
    log_ref.set(log_data)
    return log_ref.id
