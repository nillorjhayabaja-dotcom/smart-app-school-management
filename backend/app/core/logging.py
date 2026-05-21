import json
import logging
import uuid
from datetime import datetime
from typing import Any, Dict, Optional


class JSONFormatter(logging.Formatter):
    """
    JSON formatter for structured logging.
    
    Outputs log records as JSON objects for easy parsing by log aggregation
    systems like ELK stack, CloudWatch, etc.
    """
    
    def format(self, record: logging.LogRecord) -> str:
        """Format the log record as JSON."""
        log_data: Dict[str, Any] = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        
        # Add optional fields
        if hasattr(record, "request_id"):
            log_data["request_id"] = record.request_id
        
        if hasattr(record, "path"):
            log_data["path"] = record.path
        
        if hasattr(record, "method"):
            log_data["method"] = record.method
        
        if hasattr(record, "status_code"):
            log_data["status_code"] = record.status_code
        
        if hasattr(record, "user_id"):
            log_data["user_id"] = record.user_id
        
        # Add extra fields from record
        if hasattr(record, "extra"):
            log_data.update(record.extra)
        
        # Add exception info if present
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)
        
        return json.dumps(log_data)


class TextFormatter(logging.Formatter):
    """
    Human-readable text formatter for development.
    
    Outputs log records in a readable format for local development.
    """
    
    def format(self, record: logging.LogRecord) -> str:
        """Format the log record as human-readable text."""
        parts = [
            datetime.utcnow().isoformat() + "Z",
            record.levelname,
            f"[{record.name}]",
            record.getMessage(),
        ]
        
        # Add optional fields
        if hasattr(record, "request_id"):
            parts.append(f"request_id={record.request_id}")
        
        if hasattr(record, "path"):
            parts.append(f"path={record.path}")
        
        if hasattr(record, "method"):
            parts.append(f"method={record.method}")
        
        if hasattr(record, "status_code"):
            parts.append(f"status={record.status_code}")
        
        return " ".join(parts)


def get_logger(
    name: str,
    level: int = logging.INFO,
    json_format: bool = False,
) -> logging.Logger:
    """
    Create or get a logger with the specified configuration.
    
    Args:
        name: Logger name (usually __name__)
        level: Logging level (default: INFO)
        json_format: Whether to use JSON format (default: False for development)
        
    Returns:
        Configured logger instance
    """
    logger = logging.getLogger(name)
    if logger.handlers:
        return logger
    
    logger.setLevel(level)
    handler = logging.StreamHandler()
    
    if json_format:
        formatter = JSONFormatter()
    else:
        formatter = TextFormatter()
    
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    
    return logger


def new_request_id() -> str:
    """Generate a unique request ID for tracking."""
    return str(uuid.uuid4())


def setup_logging(
    level: int = logging.INFO,
    json_format: bool = False,
) -> None:
    """
    Configure root logging for the application.
    
    Args:
        level: Root logging level
        json_format: Whether to use JSON format
    """
    logging.basicConfig(
        level=level,
        handlers=[logging.StreamHandler()],
    )
    
    # Set format for root handler
    root_logger = logging.getLogger()
    root_logger.setLevel(level)
    
    for handler in root_logger.handlers:
        if json_format:
            handler.setFormatter(JSONFormatter())
        else:
            handler.setFormatter(TextFormatter())

