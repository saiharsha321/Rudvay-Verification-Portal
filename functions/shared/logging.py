import json
import logging
import sys
from datetime import datetime, timezone
from typing import Any, Dict, Optional

class StructuredLogger:
    def __init__(self, service_name: str = "certificate-functions"):
        self.service_name = service_name
        self._logger = logging.getLogger(service_name)
        self._logger.setLevel(logging.INFO)
        if not self._logger.handlers:
            handler = logging.StreamHandler(sys.stdout)
            handler.setFormatter(logging.Formatter('%(message)s'))
            self._logger.addHandler(handler)

    def _log(
        self,
        level: str,
        message: str,
        request_id: Optional[str] = None,
        user_id: Optional[str] = None,
        job_id: Optional[str] = None,
        certificate_id: Optional[str] = None,
        operation: Optional[str] = None,
        extra: Optional[Dict[str, Any]] = None,
    ):
        payload = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": level,
            "service": self.service_name,
            "message": message,
            "requestId": request_id,
            "userId": user_id,
            "jobId": job_id,
            "certificateId": certificate_id,
            "operation": operation,
            **(extra or {})
        }
        # Filter out None values
        clean_payload = {k: v for k, v in payload.items() if v is not None}
        log_json = json.dumps(clean_payload)
        
        if level == "INFO":
            self._logger.info(log_json)
        elif level == "WARNING":
            self._logger.warning(log_json)
        elif level == "ERROR":
            self._logger.error(log_json)
        else:
            self._logger.debug(log_json)

    def info(self, message: str, **kwargs):
        self._log("INFO", message, **kwargs)

    def warning(self, message: str, **kwargs):
        self._log("WARNING", message, **kwargs)

    def error(self, message: str, **kwargs):
        self._log("ERROR", message, **kwargs)

logger = StructuredLogger()
