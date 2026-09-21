import io
import re
from typing import Dict, Any, Optional
from reportlab.lib.pagesizes import A4, landscape, portrait, letter
from reportlab.lib import colors
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader

from functions.templates.schema import TemplateDesignJSON, TemplateElement
from functions.certificates.qr import generate_verification_qr_stream
from functions.shared.errors import PdfGenerationError
from functions.shared.logging import logger

def hex_to_reportlab_color(hex_str: Optional[str], default: colors.Color = colors.black) -> colors.Color:
    """Converts a CSS hex color string (#RRGGBB) to a ReportLab Color object."""
    if not hex_str:
        return default
    hex_str = hex_str.strip().lstrip("#")
    if len(hex_str) == 6:
        r = int(hex_str[0:2], 16) / 255.0
        g = int(hex_str[2:4], 16) / 255.0
        b = int(hex_str[4:6], 16) / 255.0
        return colors.Color(r, g, b)
    elif len(hex_str) == 3:
        r = int(hex_str[0] * 2, 16) / 255.0
        g = int(hex_str[1] * 2, 16) / 255.0
        b = int(hex_str[2] * 2, 16) / 255.0
        return colors.Color(r, g, b)
    return default

def interpolate_placeholders(text: str, context: Dict[str, Any]) -> str:
    """
    Replaces template placeholder tags such as {{name}}, {{course}}, {{date}}
    with context values safely.
    """
    if not text:
        return ""
    
    def replacer(match):
        key = match.group(1).strip()
        val = context.get(key, "")
        return str(val) if val is not None else ""

    # Matches {{placeholder}}
    return re.sub(r"\{\{([a-zA-Z0-9_\-\s]+)\}\}", replacer, text)

def render_certificate_pdf(
    design: TemplateDesignJSON,
    context: Dict[str, Any],
    verification_url: str
) -> io.BytesIO:
    """
    Renders a certificate deterministically in-memory to an io.BytesIO stream using ReportLab.
    No file is saved to disk. Memory is freed once the caller finishes with the stream.
    """
    try:
        pdf_stream = io.BytesIO()
        page_width = design.width
        page_height = design.height
        
        # Initialize ReportLab canvas
        c = canvas.Canvas(pdf_stream, pagesize=(page_width, page_height))
        
        # 1. Background Fill
        bg_color = hex_to_reportlab_color(design.backgroundColor, colors.white)
        c.setFillColor(bg_color)
        c.rect(0, 0, page_width, page_height, fill=1, stroke=0)
        
        # 1b. Custom Background Image if present
        bg_img_data = getattr(design, "backgroundImage", None)
        if bg_img_data and isinstance(bg_img_data, str) and bg_img_data.startswith("data:image"):
            try:
                import base64
                header, encoded = bg_img_data.split(",", 1)
                img_bytes = base64.b64decode(encoded)
                c.drawImage(ImageReader(io.BytesIO(img_bytes)), 0, 0, width=page_width, height=page_height, mask='auto')
            except Exception as e:
                logger.error(f"Error rendering background image: {e}")
        
        # 2. Draw Decorative Borders
        border = design.border
        if border.style != "none":
            border_color = hex_to_reportlab_color(border.color, colors.Color(0.04, 0.1, 0.17))
            inset = border.inset
            c.setStrokeColor(border_color)
            c.setLineWidth(border.width)
            
            if border.style == "double":
                # Outer rect
                c.rect(inset, inset, page_width - (2 * inset), page_height - (2 * inset), fill=0, stroke=1)
                # Inner rect with accent
                inner_inset = inset + 5
                accent_color = hex_to_reportlab_color(design.accentColor, colors.Color(0.83, 0.69, 0.22))
                c.setStrokeColor(accent_color)
                c.setLineWidth(1.0)
                c.rect(inner_inset, inner_inset, page_width - (2 * inner_inset), page_height - (2 * inner_inset), fill=0, stroke=1)
            else:
                c.rect(inset, inset, page_width - (2 * inset), page_height - (2 * inset), fill=0, stroke=1)
        
        # Prepare context with verification_url and certificate_id
        cert_context = {
            "name": context.get("recipientName") or context.get("name", ""),
            "recipient_name": context.get("recipientName") or context.get("name", ""),
            "course": context.get("programName") or context.get("course", ""),
            "program": context.get("programName") or context.get("course", ""),
            "event": context.get("eventName") or context.get("event", ""),
            "date": context.get("issueDate") or context.get("date", ""),
            "duration": context.get("duration", ""),
            "certificate_id": context.get("certificateId", ""),
            "verification_url": verification_url,
            "email": context.get("recipientEmail") or context.get("email", ""),
        }
        
        # Generate QR code stream once in memory
        qr_stream = generate_verification_qr_stream(verification_url)
        qr_image = ImageReader(qr_stream)
        
        # 3. Render Elements
        for elem in design.elements:
            if not elem.visibility:
                continue
            
            # ReportLab coordinates have origin (0,0) at bottom-left
            # Design JSON uses origin (0,0) at top-left
            elem_x = elem.x
            elem_y = page_height - elem.y - elem.height
            
            c.saveState()
            
            if elem.opacity < 1.0:
                c.setFillAlpha(elem.opacity)
            
            if elem.type == "TEXT":
                interpolated_text = interpolate_placeholders(elem.content, cert_context)
                text_color = hex_to_reportlab_color(elem.textColor, colors.Color(0.04, 0.1, 0.17))
                c.setFillColor(text_color)
                
                # Standard font mappings
                font_name = "Helvetica"
                if "bold" in elem.fontWeight.lower():
                    font_name = "Helvetica-Bold"
                elif "italic" in elem.fontWeight.lower():
                    font_name = "Helvetica-Oblique"
                elif "times" in elem.fontFamily.lower() or "serif" in elem.fontFamily.lower():
                    font_name = "Times-Bold" if "bold" in elem.fontWeight.lower() else "Times-Roman"
                
                c.setFont(font_name, elem.fontSize)
                
                # Compute vertical center within element bounding box
                y_baseline = elem_y + (elem.height / 2.0) - (elem.fontSize / 3.0)
                
                if elem.alignment == "center":
                    c.drawCentredString(elem_x + (elem.width / 2.0), y_baseline, interpolated_text)
                elif elem.alignment == "right":
                    c.drawRightString(elem_x + elem.width, y_baseline, interpolated_text)
                else:
                    c.drawString(elem_x, y_baseline, interpolated_text)
                    
            elif elem.type == "QR":
                # Draw QR code image
                c.drawImage(
                    qr_image,
                    elem_x,
                    elem_y,
                    width=elem.width,
                    height=elem.height,
                    mask='auto'
                )
                
            elif elem.type == "LINE":
                stroke_color = hex_to_reportlab_color(elem.strokeColor or elem.textColor, colors.Color(0.83, 0.69, 0.22))
                c.setStrokeColor(stroke_color)
                c.setLineWidth(elem.strokeWidth)
                c.line(elem_x, elem_y + (elem.height / 2.0), elem_x + elem.width, elem_y + (elem.height / 2.0))
                
            elif elem.type == "RECTANGLE":
                if elem.fillColor:
                    c.setFillColor(hex_to_reportlab_color(elem.fillColor))
                if elem.strokeColor:
                    c.setStrokeColor(hex_to_reportlab_color(elem.strokeColor))
                    c.setLineWidth(elem.strokeWidth)
                c.rect(
                    elem_x,
                    elem_y,
                    elem.width,
                    elem.height,
                    fill=1 if elem.fillColor else 0,
                    stroke=1 if elem.strokeColor else 0
                )
            elif str(elem.type) == "IMAGE" and elem.content and elem.content.startswith("data:image"):
                try:
                    import base64
                    header, encoded = elem.content.split(",", 1)
                    img_bytes = base64.b64decode(encoded)
                    c.drawImage(ImageReader(io.BytesIO(img_bytes)), elem_x, elem_y, width=elem.width, height=elem.height, mask='auto')
                except Exception as e:
                    logger.error(f"Error rendering element image: {e}")
            
            c.restoreState()
        
        c.showPage()
        c.save()
        
        # Reset stream position to beginning
        pdf_stream.seek(0)
        return pdf_stream
    except Exception as e:
        logger.error("Failed to render PDF certificate", extra={"error": str(e)})
        raise PdfGenerationError(f"PDF rendering failed: {str(e)}")
