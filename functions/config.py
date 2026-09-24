import os
from pydantic import BaseModel, Field

class Settings(BaseModel):
    PROJECT_NAME: str = "Rudvay Tech Certificate Platform"
    FIREBASE_PROJECT_ID: str = os.getenv("FIREBASE_PROJECT_ID", "rudvaytech-cert")
    VERIFY_BASE_URL: str = os.getenv("VERIFY_BASE_URL", "https://certifications.rudvay.tech/verify")
    
    # SMTP Defaults (from env/Secret Manager)
    SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.mailgun.org")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USERNAME: str = os.getenv("SMTP_USERNAME", "postmaster@rudvaytech.com")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    SMTP_FROM_EMAIL: str = os.getenv("SMTP_FROM_EMAIL", "certificates@rudvaytech.com")
    SMTP_FROM_NAME: str = os.getenv("SMTP_FROM_NAME", "Rudvay Tech")
    SMTP_USE_TLS: bool = os.getenv("SMTP_USE_TLS", "true").lower() in ("true", "1", "yes")
    
    # Security
    APP_SECRET_KEY: str = os.getenv("APP_SECRET_KEY", "rudvay-tech-super-secure-secret-key-32-bytes")
    RATE_LIMIT_PER_MINUTE: int = 60
    MAX_EXCEL_FILE_SIZE_BYTES: int = 10 * 1024 * 1024  # 10MB
    MAX_EXCEL_ROWS: int = 2500

settings = Settings()
