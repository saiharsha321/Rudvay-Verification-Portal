import re
from functions.certificates.ids import generate_certificate_id, generate_verification_code

def test_generate_certificate_id_format():
    cert_id = generate_certificate_id(year=2026, length=6)
    # Must match RT-2026-XXXXXX where X is alphanumeric uppercase
    assert re.match(r"^RT-2026-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$", cert_id)

def test_generate_certificate_id_uniqueness():
    ids = set()
    for _ in range(1000):
        cid = generate_certificate_id(year=2026, length=6)
        assert cid not in ids
        ids.add(cid)
    assert len(ids) == 1000

def test_generate_verification_code():
    code = generate_verification_code(8)
    assert len(code) == 8
    assert code.isalnum()
