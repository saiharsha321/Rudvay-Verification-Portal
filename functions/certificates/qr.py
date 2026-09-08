import io
import qrcode
from qrcode.constants import ERROR_CORRECT_H
from functions.config import settings
from functions.shared.errors import QrGenerationError
from functions.shared.logging import logger

def generate_verification_qr_stream(verification_url: str, box_size: int = 10, border: int = 2) -> io.BytesIO:
    """
    Generates a high-resolution QR code stream containing exclusively the verification URL.
    Returns an in-memory io.BytesIO stream containing PNG data.
    """
    try:
        qr = qrcode.QRCode(
            version=None,
            error_correction=ERROR_CORRECT_H,  # High error correction for reliable scanning
            box_size=box_size,
            border=border,
        )
        qr.add_data(verification_url)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="#0B192C", back_color="transparent")
        
        # Save directly to BytesIO
        stream = io.BytesIO()
        img.save(stream, format="PNG")
        stream.seek(0)
        return stream
    except Exception as e:
        logger.error(f"Failed to generate QR code for URL: {verification_url}", extra={"error": str(e)})
        raise QrGenerationError(f"QR Generation failed: {str(e)}")

def build_verification_url(certificate_id: str, base_url: str = None) -> str:
    """Constructs the canonical public verification URL for a certificate"""
    url_base = base_url or settings.VERIFY_BASE_URL.rstrip('/')
    return f"{url_base}/{certificate_id}"
