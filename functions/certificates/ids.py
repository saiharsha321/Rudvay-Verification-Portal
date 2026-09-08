import secrets
import string
from datetime import datetime, timezone
from typing import Optional
from google.cloud import firestore
from functions.shared.logging import logger

# Non-ambiguous uppercase characters (excluding easily confused 0/O, 1/I/L)
ID_CHARSET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"

def generate_certificate_id(year: Optional[int] = None, length: int = 6) -> str:
    """
    Generates a cryptographically secure, non-guessable, human-readable certificate ID.
    Format: RT-YYYY-XXXXXX (e.g., RT-2026-7K9P4X)
    """
    if year is None:
        year = datetime.now(timezone.utc).year
    random_part = "".join(secrets.choice(ID_CHARSET) for _ in range(length))
    return f"RT-{year}-{random_part}"

def generate_verification_code(length: int = 8) -> str:
    """Generates an 8-character secure verification code"""
    return "".join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(length))

def generate_unique_certificate_id(db: Optional[firestore.Client] = None, max_attempts: int = 5) -> str:
    """
    Generates a unique certificate ID and verifies against Firestore to prevent collision.
    """
    year = datetime.now(timezone.utc).year
    for attempt in range(max_attempts):
        candidate_id = generate_certificate_id(year=year)
        if db is None:
            return candidate_id
        
        # Check if ID already exists
        doc_ref = db.collection("certificates").document(candidate_id)
        if not doc_ref.get().exists:
            return candidate_id
        
        logger.warning("Certificate ID collision detected, generating new ID", extra={"attempt": attempt, "id": candidate_id})
    
    # Fallback to longer random part if collision loop exhausted
    return f"RT-{year}-{''.join(secrets.choice(ID_CHARSET) for _ in range(10))}"
