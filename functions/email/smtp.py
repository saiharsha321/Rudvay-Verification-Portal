import io
import smtplib
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
from typing import Optional, Dict, Any

from functions.config import settings
from functions.shared.errors import SmtpConnectionError, EmailSendError
from functions.shared.logging import logger

def test_smtp_connection(
    host: str,
    port: int,
    username: str,
    password: str,
    use_tls: bool = True
) -> bool:
    """
    Tests an SMTP connection and authentication handshake.
    Raises SmtpConnectionError on failure.
    """
    server = None
    try:
        context = ssl.create_default_context()
        if port == 465:
            server = smtplib.SMTP_SSL(host, port, context=context, timeout=10)
        else:
            server = smtplib.SMTP(host, port, timeout=10)
            if use_tls:
                server.starttls(context=context)
                
        if username and password:
            server.login(username, password)
            
        return True
    except Exception as e:
        logger.error("SMTP Connection test failed", extra={"host": host, "port": port, "error": str(e)})
        raise SmtpConnectionError(f"SMTP connection test failed: {str(e)}")
    finally:
        if server:
            try:
                server.quit()
            except Exception:
                pass

def send_certificate_email_smtp(
    recipient_email: str,
    recipient_name: str,
    course_name: str,
    certificate_id: str,
    verification_url: str,
    pdf_stream: io.BytesIO,
    smtp_override: Optional[Dict[str, Any]] = None
) -> bool:
    """
    Sends an email with the in-memory PDF certificate attached directly.
    Zero disk storage: reads from io.BytesIO.
    """
    host = (smtp_override and smtp_override.get("host")) or settings.SMTP_HOST
    port = int((smtp_override and smtp_override.get("port")) or settings.SMTP_PORT)
    username = (smtp_override and smtp_override.get("username")) or settings.SMTP_USERNAME
    password = (smtp_override and smtp_override.get("password")) or settings.SMTP_PASSWORD
    from_email = (smtp_override and smtp_override.get("fromEmail")) or settings.SMTP_FROM_EMAIL
    from_name = (smtp_override and smtp_override.get("fromName")) or settings.SMTP_FROM_NAME
    use_tls = (smtp_override and smtp_override.get("useTls", True)) if smtp_override else settings.SMTP_USE_TLS
    
    msg = MIMEMultipart("mixed")
    msg["Subject"] = f"Your Rudvay Tech Certificate – {course_name}"
    msg["From"] = f"{from_name} <{from_email}>"
    msg["To"] = recipient_email
    
    # Text Body
    body_text = f"""Dear {recipient_name},

Congratulations on successfully completing {course_name}.

Please find your official Rudvay Tech certificate attached to this email.

Certificate ID: {certificate_id}
Verification URL: {verification_url}

You can also verify the authenticity of this certificate at any time by scanning the QR code or visiting our verification portal.

Best Regards,
Rudvay Tech Team
https://rudvaytech.com
"""
    msg.attach(MIMEText(body_text, "plain", "utf-8"))
    
    # HTML Body
    body_html = f"""<!DOCTYPE html>
<html>
<head>
<style>
  body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 20px; }}
  .card {{ max-width: 600px; margin: auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }}
  .header {{ background: #0B192C; color: #ffffff; padding: 30px; text-align: center; }}
  .header h1 {{ margin: 0; font-size: 24px; letter-spacing: 1px; color: #D4AF37; }}
  .content {{ padding: 30px; }}
  .badge {{ background: #f0f7ff; border: 1px solid #bae0fd; border-radius: 8px; padding: 15px; margin: 20px 0; }}
  .badge-id {{ font-size: 18px; font-weight: bold; color: #0259a1; letter-spacing: 1px; }}
  .btn {{ display: inline-block; background: #0c8ee9; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 15px; }}
  .footer {{ padding: 20px; text-align: center; font-size: 12px; color: #64748b; background: #f8fafc; border-top: 1px solid #e2e8f0; }}
</style>
</head>
<body>
<div class="card">
  <div class="header">
    <h1>RUDVAY TECH</h1>
    <p style="margin: 5px 0 0 0; color: #94a3b8; font-size: 14px;">Official Certificate of Completion</p>
  </div>
  <div class="content">
    <p>Dear <strong>{recipient_name}</strong>,</p>
    <p>Congratulations on successfully completing <strong>{course_name}</strong>!</p>
    <p>Your official verifiable certificate is attached to this email as a secure PDF.</p>
    
    <div class="badge">
      <div style="font-size: 12px; color: #64748b; text-transform: uppercase;">Certificate Identifier</div>
      <div class="badge-id">{certificate_id}</div>
    </div>
    
    <a href="{verification_url}" class="btn" style="color: #ffffff;">Verify Certificate Online</a>
  </div>
  <div class="footer">
    &copy; {settings.PROJECT_NAME}. All rights reserved.<br/>
    This is an automated message. Please do not reply directly to this email.
  </div>
</div>
</body>
</html>
"""
    msg.attach(MIMEText(body_html, "html", "utf-8"))
    
    # Attach In-Memory PDF
    pdf_stream.seek(0)
    pdf_attachment = MIMEApplication(pdf_stream.read(), _subtype="pdf")
    pdf_attachment.add_header(
        "Content-Disposition",
        "attachment",
        filename=f"Rudvay_Tech_Certificate_{certificate_id}.pdf"
    )
    msg.attach(pdf_attachment)
    
    server = None
    try:
        context = ssl.create_default_context()
        if port == 465:
            server = smtplib.SMTP_SSL(host, port, context=context, timeout=20)
        else:
            server = smtplib.SMTP(host, port, timeout=20)
            if use_tls:
                server.starttls(context=context)
                
        if username and password:
            server.login(username, password)
            
        server.send_message(msg)
        return True
    except Exception as e:
        logger.error(f"Failed to send certificate email to {recipient_email}", extra={"error": str(e), "certificateId": certificate_id})
        raise EmailSendError(f"Email dispatch failed: {str(e)}")
    finally:
        if server:
            try:
                server.quit()
            except Exception:
                pass
