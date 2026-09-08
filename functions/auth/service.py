from typing import Dict, Any, Optional
import firebase_admin
from firebase_admin import auth as fb_auth, firestore as fb_firestore
from google.cloud import firestore

from functions.shared.constants import UserRole, AuditAction
from functions.shared.errors import UnauthorizedError, ForbiddenError, ValidationError
from functions.shared.logging import logger

def initialize_firebase_admin():
    """Idempotently initializes Firebase Admin SDK"""
    try:
        return firebase_admin.get_app()
    except ValueError:
        return firebase_admin.initialize_app()

def get_firestore_client() -> firestore.Client:
    """Returns initialized Firestore client"""
    initialize_firebase_admin()
    return fb_firestore.client()

def set_user_role(uid: str, role: UserRole):
    """Sets Firebase Authentication custom claims"""
    claims = {
        "role": role.value,
        "admin": role == UserRole.ADMIN,
        "coordinator": role == UserRole.COORDINATOR
    }
    fb_auth.set_custom_user_claims(uid, claims)

def create_coordinator_user(
    db: firestore.Client,
    email: str,
    password: str,
    display_name: str,
    actor_uid: str
) -> Dict[str, Any]:
    """
    Creates a new coordinator Auth user and Firestore user/coordinator records.
    """
    try:
        user_record = fb_auth.create_user(
            email=email,
            password=password,
            display_name=display_name,
            email_verified=True
        )
        
        # Set custom claims
        set_user_role(user_record.uid, UserRole.COORDINATOR)
        
        # Write to users and coordinators collections
        batch = db.batch()
        user_ref = db.collection("users").document(user_record.uid)
        batch.set(user_ref, {
            "uid": user_record.uid,
            "email": email,
            "displayName": display_name,
            "role": UserRole.COORDINATOR.value,
            "active": True,
            "emailVerified": True,
            "createdAt": firestore.SERVER_TIMESTAMP,
            "updatedAt": firestore.SERVER_TIMESTAMP
        })
        
        coord_ref = db.collection("coordinators").document(user_record.uid)
        batch.set(coord_ref, {
            "coordinatorId": user_record.uid,
            "email": email,
            "name": display_name,
            "active": True,
            "totalCertificatesIssued": 0,
            "createdAt": firestore.SERVER_TIMESTAMP
        })
        
        batch.commit()
        logger.info(f"Coordinator created: {email} ({user_record.uid})", user_id=actor_uid)
        
        return {
            "uid": user_record.uid,
            "email": email,
            "displayName": display_name,
            "role": UserRole.COORDINATOR.value,
            "active": True
        }
    except Exception as e:
        logger.error(f"Failed to create coordinator {email}: {str(e)}")
        raise ValidationError(f"Failed to create coordinator: {str(e)}")

def toggle_coordinator_status(
    db: firestore.Client,
    uid: str,
    active: bool,
    actor_uid: str
) -> Dict[str, Any]:
    """Enables or disables a coordinator account"""
    fb_auth.update_user(uid, disabled=not active)
    
    batch = db.batch()
    user_ref = db.collection("users").document(uid)
    batch.update(user_ref, {"active": active, "updatedAt": firestore.SERVER_TIMESTAMP})
    
    coord_ref = db.collection("coordinators").document(uid)
    batch.update(coord_ref, {"active": active, "updatedAt": firestore.SERVER_TIMESTAMP})
    
    batch.commit()
    logger.info(f"Coordinator {uid} active state set to {active}", user_id=actor_uid)
    return {"uid": uid, "active": active}
