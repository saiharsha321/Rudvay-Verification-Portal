from typing import List, Dict, Any, Optional
import difflib

COMMON_PLACEHOLDER_ALIASES = {
    "name": ["name", "full name", "fullname", "participant name", "recipient", "student name", "candidate"],
    "email": ["email", "email address", "mail", "e-mail", "recipient email", "user email"],
    "course": ["course", "course name", "program", "program name", "workshop", "topic", "training", "subject"],
    "event": ["event", "event name", "workshop", "webinar", "conference", "session"],
    "date": ["date", "completion date", "issue date", "passed on", "event date"],
    "duration": ["duration", "hours", "time", "length", "credits"]
}

def auto_detect_column_mapping(headers: List[str]) -> Dict[str, str]:
    """
    Suggests best-guess mappings between Excel headers and standard placeholders.
    User in UI will still confirm / override the mapping explicitly.
    """
    mapping: Dict[str, str] = {}
    lower_headers = {h.lower().strip(): h for h in headers}
    
    for placeholder, aliases in COMMON_PLACEHOLDER_ALIASES.items():
        # Exact match check
        found = False
        for alias in aliases:
            if alias in lower_headers:
                mapping[placeholder] = lower_headers[alias]
                found = True
                break
        
        # Fuzzy match if exact not found
        if not found:
            matches = difflib.get_close_matches(placeholder, [h.lower() for h in headers], n=1, cutoff=0.6)
            if matches:
                mapping[placeholder] = lower_headers[matches[0]]
                
    return mapping
