from typing import Optional, Dict, Any, Callable
from functools import wraps
from fastapi import Request, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from firebase_admin import auth as fb_auth

from functions.shared.errors import UnauthorizedError, ForbiddenError
from functions.shared.constants import UserRole
from functions.shared.logging import logger

security_scheme = HTTPBearer(auto_error=False)

def verify_bearer_token(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme)) -> Dict[str, Any]:
    """
    FastAPI dependency to verify Firebase ID token and return decoded claims.
    """
    if not credentials or not credentials.credentials:
        raise HTTPException(status_code=401, detail="Authentication token missing")
        
    token = credentials.credentials
    try:
        decoded_token = fb_auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        logger.warning(f"Invalid ID token supplied: {str(e)}")
        raise HTTPException(status_code=401, detail=f"Invalid authentication token: {str(e)}")

def require_admin(user: Dict[str, Any] = Depends(verify_bearer_token)) -> Dict[str, Any]:
    """Requires ADMIN role"""
    role = user.get("role") or ("ADMIN" if user.get("admin") is True else None)
    if role != UserRole.ADMIN.value:
        raise HTTPException(status_code=403, detail="Admin privileges required for this action")
    return user

def require_coordinator_or_admin(user: Dict[str, Any] = Depends(verify_bearer_token)) -> Dict[str, Any]:
    """Requires COORDINATOR or ADMIN role"""
    role = user.get("role")
    is_admin = user.get("admin") is True or role == UserRole.ADMIN.value
    is_coord = user.get("coordinator") is True or role == UserRole.COORDINATOR.value
    
    if not (is_admin or is_coord):
        raise HTTPException(status_code=403, detail="Coordinator or Admin privileges required")
    return user
