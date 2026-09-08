import re
from typing import List, Dict, Any, Tuple
from pydantic import BaseModel, EmailStr

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")

class RowValidationError(BaseModel):
    rowNumber: int
    field: str
    message: str
    value: Any = None

class ExcelValidationReport(BaseModel):
    totalRows: int
    validRowsCount: int
    invalidRowsCount: int
    headers: List[str]
    validRows: List[Dict[str, Any]]
    errors: List[RowValidationError]

def validate_email_syntax(email: str) -> bool:
    if not email or not isinstance(email, str):
        return False
    return bool(EMAIL_REGEX.match(email.strip()))

def validate_mapped_rows(
    raw_rows: List[Dict[str, Any]],
    column_mapping: Dict[str, str], # Maps Placeholder (e.g. "name", "email", "course", "date") -> Excel Header
    required_placeholders: List[str] = None
) -> ExcelValidationReport:
    """
    Applies the column mapping and validates every row for:
    - Required fields (name, email, course, date)
    - Valid email syntax
    - Duplicate email detection within the dataset
    """
    if required_placeholders is None:
        required_placeholders = ["name", "email", "course", "date"]
        
    errors: List[RowValidationError] = []
    valid_rows: List[Dict[str, Any]] = []
    seen_emails: set = set()
    
    for row in raw_rows:
        row_num = row.get("_row_number", 0)
        mapped_row: Dict[str, Any] = {"_row_number": row_num}
        row_has_error = False
        
        # Extract mapped values
        for placeholder, col_name in column_mapping.items():
            val = row.get(col_name, "")
            mapped_row[placeholder] = str(val).strip() if val is not None else ""
            
        # Check required fields
        for req in required_placeholders:
            val = mapped_row.get(req, "")
            if not val:
                errors.append(RowValidationError(
                    rowNumber=row_num,
                    field=req,
                    message=f"Missing required field: {req}",
                    value=val
                ))
                row_has_error = True
                
        # Validate email
        email_val = mapped_row.get("email", "")
        if email_val:
            if not validate_email_syntax(email_val):
                errors.append(RowValidationError(
                    rowNumber=row_num,
                    field="email",
                    message="Invalid email address format",
                    value=email_val
                ))
                row_has_error = True
            elif email_val.lower() in seen_emails:
                errors.append(RowValidationError(
                    rowNumber=row_num,
                    field="email",
                    message="Duplicate email recipient in file",
                    value=email_val
                ))
                row_has_error = True
            else:
                seen_emails.add(email_val.lower())
                
        if not row_has_error:
            valid_rows.append(mapped_row)
            
    return ExcelValidationReport(
        totalRows=len(raw_rows),
        validRowsCount=len(valid_rows),
        invalidRowsCount=len(errors),
        headers=list(column_mapping.values()),
        validRows=valid_rows,
        errors=errors
    )
