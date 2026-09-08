import io
from functions.certificates.qr import generate_verification_qr_stream, build_verification_url

def test_build_verification_url():
    url = build_verification_url("RT-2026-7K9P4X", base_url="https://verify.rudvaytech.com/c")
    assert url == "https://verify.rudvaytech.com/c/RT-2026-7K9P4X"

def test_generate_verification_qr_stream():
    url = "https://verify.rudvaytech.com/c/RT-2026-7K9P4X"
    stream = generate_verification_qr_stream(url)
    assert isinstance(stream, io.BytesIO)
    stream_bytes = stream.read()
    assert len(stream_bytes) > 100
    # Check PNG magic header: \x89PNG\r\n\x1a\n
    assert stream_bytes.startswith(b"\x89PNG\r\n\x1a\n")
