from typing import List, Optional, Dict, Any
from pydantic import BaseModel, EmailStr, Field

class PublicCertificateResponse(BaseModel):
    certificateId: str
    recipientName: str
    programName: str
    eventName: str
    issueDate: str
    duration: Optional[str] = ""
    status: str
    issuer: str = "Rudvay Tech"
    verificationUrl: str

class AuthUserDTO(BaseModel):
    uid: str
    email: str
    role: str
    displayName: Optional[str] = None
    active: bool = True

class SingleCertificateRequest(BaseModel):
    name: str = Field(..., min_length=1)
    email: EmailStr
    course: str = Field(..., min_length=1)
    event: str = Field(..., min_length=1)
    date: str
    duration: Optional[str] = ""
    templateId: str
    templateVersion: Optional[int] = None
    eventId: Optional[str] = None
    sendEmail: bool = True

class SmtpConfigDTO(BaseModel):
    host: str
    port: int
    username: str
    password: Optional[str] = None  # Write-only
    fromName: str
    fromEmail: EmailStr
    useTls: bool = True

class SmtpTestRequest(BaseModel):
    host: str
    port: int
    username: str
    password: str
    fromEmail: EmailStr
    useTls: bool = True
    recipientEmail: EmailStr

class RevokeCertificateRequest(BaseModel):
    reason: str = Field(..., min_length=3)
