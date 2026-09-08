from functions.excel.validator import validate_mapped_rows, validate_email_syntax

def test_validate_email_syntax():
    assert validate_email_syntax("user@example.com") is True
    assert validate_email_syntax("john.doe+work@rudvaytech.com") is True
    assert validate_email_syntax("invalid-email") is False
    assert validate_email_syntax("@missingusername.com") is False
    assert validate_email_syntax("user@") is False
    assert validate_email_syntax("") is False

def test_validate_mapped_rows_valid_and_invalid():
    raw_rows = [
        {"_row_number": 2, "Full Name": "Alice Smith", "Email Address": "alice@example.com", "Course": "Python Security", "Date": "2026-09-08"},
        {"_row_number": 3, "Full Name": "Bob Jones", "Email Address": "invalid-email-address", "Course": "Cloud Architecture", "Date": "2026-09-08"},
        {"_row_number": 4, "Full Name": "", "Email Address": "charlie@example.com", "Course": "DevOps", "Date": "2026-09-08"},
        {"_row_number": 5, "Full Name": "Duplicate User", "Email Address": "alice@example.com", "Course": "Python Security", "Date": "2026-09-08"},
    ]
    
    mapping = {
        "name": "Full Name",
        "email": "Email Address",
        "course": "Course",
        "date": "Date"
    }
    
    report = validate_mapped_rows(raw_rows, mapping)
    assert report.totalRows == 4
    assert report.validRowsCount == 1  # Only row 2 is completely valid
    assert report.invalidRowsCount >= 3  # row 3 (bad email), row 4 (missing name), row 5 (duplicate email)
