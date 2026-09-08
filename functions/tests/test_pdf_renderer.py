import io
from functions.templates.schema import TemplateDesignJSON, TemplateElement, BorderConfig
from functions.shared.constants import ElementType
from functions.certificates.renderer import render_certificate_pdf, interpolate_placeholders

def test_interpolate_placeholders():
    text = "Certificate of Completion for {{name}} in {{course}} on {{date}}"
    ctx = {"name": "Jane Doe", "course": "Cybersecurity 101", "date": "2026-09-08"}
    res = interpolate_placeholders(text, ctx)
    assert res == "Certificate of Completion for Jane Doe in Cybersecurity 101 on 2026-09-08"

def test_render_certificate_pdf_in_memory():
    design = TemplateDesignJSON(
        width=842,
        height=595,
        backgroundColor="#FFFFFF",
        accentColor="#D4AF37",
        border=BorderConfig(style="double", color="#0B192C", width=2.0),
        elements=[
            TemplateElement(
                id="title",
                type=ElementType.TEXT,
                x=50,
                y=80,
                width=742,
                height=50,
                content="RUDVAY TECH CERTIFICATE",
                fontSize=26,
                fontWeight="bold",
                alignment="center",
                textColor="#0B192C"
            ),
            TemplateElement(
                id="recipient",
                type=ElementType.TEXT,
                x=50,
                y=180,
                width=742,
                height=40,
                content="{{name}}",
                fontSize=22,
                fontWeight="bold",
                alignment="center",
                textColor="#0259A1"
            ),
            TemplateElement(
                id="qr_code",
                type=ElementType.QR,
                x=670,
                y=420,
                width=100,
                height=100
            )
        ]
    )
    
    ctx = {
        "certificateId": "RT-2026-TEST99",
        "recipientName": "Jane Doe",
        "recipientEmail": "jane@example.com",
        "programName": "Python Architecture",
        "eventName": "Tech Summit 2026",
        "issueDate": "2026-09-08"
    }
    
    pdf_stream = render_certificate_pdf(design, ctx, "https://verify.rudvaytech.com/c/RT-2026-TEST99")
    assert isinstance(pdf_stream, io.BytesIO)
    pdf_bytes = pdf_stream.read()
    assert len(pdf_bytes) > 500
    # PDF magic bytes
    assert pdf_bytes.startswith(b"%PDF-")
