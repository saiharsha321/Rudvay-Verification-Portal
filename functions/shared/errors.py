from typing import Optional, Any, Dict

class AppError(Exception):
    def __init__(
        self,
        message: str,
        code: str = "INTERNAL_ERROR",
        status_code: int = 500,
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details or {}

class UnauthorizedError(AppError):
    def __init__(self, message: str = "Authentication required"):
        super().__init__(message, code="UNAUTHORIZED", status_code=401)

class ForbiddenError(AppError):
    def __init__(self, message: str = "Access forbidden for this role"):
        super().__init__(message, code="FORBIDDEN", status_code=403)

class NotFoundError(AppError):
    def __init__(self, message: str = "Resource not found", code: str = "NOT_FOUND"):
        super().__init__(message, code=code, status_code=404)

class ValidationError(AppError):
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message, code="VALIDATION_ERROR", status_code=400, details=details)

class InvalidExcelError(AppError):
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message, code="INVALID_EXCEL", status_code=400, details=details)

class CertificateNotFoundError(NotFoundError):
    def __init__(self, message: str = "Certificate ID not found"):
        super().__init__(message, code="CERTIFICATE_NOT_FOUND")

class CertificateRevokedError(AppError):
    def __init__(self, message: str = "This certificate has been revoked"):
        super().__init__(message, code="CERTIFICATE_REVOKED", status_code=410)

class TemplateNotFoundError(NotFoundError):
    def __init__(self, message: str = "Template or template version not found"):
        super().__init__(message, code="TEMPLATE_NOT_FOUND")

class SmtpConnectionError(AppError):
    def __init__(self, message: str = "Failed to establish connection with SMTP server"):
        super().__init__(message, code="SMTP_CONNECTION_FAILED", status_code=502)

class EmailSendError(AppError):
    def __init__(self, message: str = "Failed to send email"):
        super().__init__(message, code="EMAIL_SEND_FAILED", status_code=500)

class PdfGenerationError(AppError):
    def __init__(self, message: str = "Failed to render PDF certificate"):
        super().__init__(message, code="PDF_GENERATION_FAILED", status_code=500)

class QrGenerationError(AppError):
    def __init__(self, message: str = "Failed to generate QR code"):
        super().__init__(message, code="QR_GENERATION_FAILED", status_code=500)

class JobAlreadyRunningError(AppError):
    def __init__(self, message: str = "Job is already being processed"):
        super().__init__(message, code="JOB_ALREADY_RUNNING", status_code=409)

class RateLimitedError(AppError):
    def __init__(self, message: str = "Too many requests. Please try again later."):
        super().__init__(message, code="RATE_LIMITED", status_code=429)
