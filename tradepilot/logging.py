# tradepilot/logging.py
"""
TradePilot Structured Logging

Provides structured logging with:
- Log levels (debug, info, warning, error, critical)
- JSON formatting for production
- Sensitive data redaction
- Correlation IDs for request tracing
"""

import json
import logging
import os
import sys
import traceback
from datetime import datetime
from typing import Any, Dict, Optional
from contextvars import ContextVar
import uuid


# Context variable for correlation ID
correlation_id: ContextVar[Optional[str]] = ContextVar('correlation_id', default=None)


class SensitiveDataFilter(logging.Filter):
    """Filter to redact sensitive data from log records."""

    SENSITIVE_KEYS = {
        'api_key', 'apikey', 'api_secret', 'apisecret',
        'password', 'passwd', 'secret', 'token',
        'authorization', 'bearer', 'credential',
        'alpaca_key', 'alpaca_secret',
    }

    def filter(self, record: logging.LogRecord) -> bool:
        """Redact sensitive data from the log record."""
        if hasattr(record, 'extra_data'):
            record.extra_data = self._redact_dict(record.extra_data)
        return True

    def _redact_dict(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Recursively redact sensitive values from a dictionary."""
        if not isinstance(data, dict):
            return data

        result = {}
        for key, value in data.items():
            if key.lower() in self.SENSITIVE_KEYS:
                result[key] = '[REDACTED]'
            elif isinstance(value, dict):
                result[key] = self._redact_dict(value)
            elif isinstance(value, list):
                result[key] = [
                    self._redact_dict(item) if isinstance(item, dict) else item
                    for item in value
                ]
            elif isinstance(value, str) and len(value) > 20:
                # Check if the string looks like a secret
                if any(pattern in key.lower() for pattern in ['key', 'secret', 'token']):
                    result[key] = '[REDACTED]'
                else:
                    result[key] = value
            else:
                result[key] = value
        return result


class JsonFormatter(logging.Formatter):
    """JSON formatter for structured logging in production."""

    def format(self, record: logging.LogRecord) -> str:
        """Format the log record as JSON."""
        log_data = {
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage(),
        }

        # Add correlation ID if present
        corr_id = correlation_id.get()
        if corr_id:
            log_data['correlation_id'] = corr_id

        # Add extra data if present
        if hasattr(record, 'extra_data') and record.extra_data:
            log_data['context'] = record.extra_data

        # Add exception info if present
        if record.exc_info:
            log_data['exception'] = {
                'type': record.exc_info[0].__name__ if record.exc_info[0] else None,
                'message': str(record.exc_info[1]) if record.exc_info[1] else None,
                'traceback': ''.join(traceback.format_exception(*record.exc_info)),
            }

        # Add source location
        log_data['source'] = {
            'file': record.filename,
            'line': record.lineno,
            'function': record.funcName,
        }

        return json.dumps(log_data)


class ConsoleFormatter(logging.Formatter):
    """Human-readable formatter for development."""

    COLORS = {
        'DEBUG': '\033[36m',    # Cyan
        'INFO': '\033[32m',     # Green
        'WARNING': '\033[33m',  # Yellow
        'ERROR': '\033[31m',    # Red
        'CRITICAL': '\033[35m', # Magenta
    }
    RESET = '\033[0m'

    def format(self, record: logging.LogRecord) -> str:
        """Format the log record for console output."""
        color = self.COLORS.get(record.levelname, '')

        # Basic message
        msg = f"{color}[{record.levelname}]{self.RESET} {record.getMessage()}"

        # Add extra data if present
        if hasattr(record, 'extra_data') and record.extra_data:
            msg += f" | {json.dumps(record.extra_data)}"

        # Add correlation ID if present
        corr_id = correlation_id.get()
        if corr_id:
            msg = f"[{corr_id[:8]}] " + msg

        return msg


class StructuredLogger:
    """
    Structured logger wrapper that supports additional context.

    Usage:
        logger = get_logger('mymodule')
        logger.info('User logged in', {'user_id': '123', 'ip': '1.2.3.4'})
    """

    def __init__(self, logger: logging.Logger):
        self._logger = logger

    def _log(self, level: int, msg: str, extra_data: Optional[Dict[str, Any]] = None,
             exc_info: bool = False) -> None:
        """Internal logging method that handles extra data."""
        record = self._logger.makeRecord(
            self._logger.name, level, '', 0, msg, (), None
        )
        record.extra_data = extra_data or {}
        if exc_info:
            record.exc_info = sys.exc_info()
        self._logger.handle(record)

    def debug(self, msg: str, extra: Optional[Dict[str, Any]] = None) -> None:
        """Log a debug message."""
        self._log(logging.DEBUG, msg, extra)

    def info(self, msg: str, extra: Optional[Dict[str, Any]] = None) -> None:
        """Log an info message."""
        self._log(logging.INFO, msg, extra)

    def warning(self, msg: str, extra: Optional[Dict[str, Any]] = None) -> None:
        """Log a warning message."""
        self._log(logging.WARNING, msg, extra)

    def error(self, msg: str, extra: Optional[Dict[str, Any]] = None,
              exc_info: bool = False) -> None:
        """Log an error message."""
        self._log(logging.ERROR, msg, extra, exc_info)

    def critical(self, msg: str, extra: Optional[Dict[str, Any]] = None,
                 exc_info: bool = False) -> None:
        """Log a critical message."""
        self._log(logging.CRITICAL, msg, extra, exc_info)

    def exception(self, msg: str, extra: Optional[Dict[str, Any]] = None) -> None:
        """Log an exception with traceback."""
        self.error(msg, extra, exc_info=True)


def setup_logging(
    level: str = 'INFO',
    json_format: bool = False,
    log_file: Optional[str] = None
) -> None:
    """
    Set up logging configuration.

    Parameters:
        level: Log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        json_format: Use JSON formatting (for production)
        log_file: Optional file path for file logging
    """
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, level.upper()))

    # Remove existing handlers
    root_logger.handlers.clear()

    # Add sensitive data filter
    sensitive_filter = SensitiveDataFilter()

    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.addFilter(sensitive_filter)

    if json_format or os.environ.get('LOG_FORMAT') == 'json':
        console_handler.setFormatter(JsonFormatter())
    else:
        console_handler.setFormatter(ConsoleFormatter())

    root_logger.addHandler(console_handler)

    # File handler (optional)
    if log_file:
        file_handler = logging.FileHandler(log_file)
        file_handler.addFilter(sensitive_filter)
        file_handler.setFormatter(JsonFormatter())  # Always JSON for files
        root_logger.addHandler(file_handler)


def get_logger(name: str) -> StructuredLogger:
    """
    Get a structured logger instance.

    Parameters:
        name: Logger name (typically __name__)

    Returns:
        StructuredLogger instance
    """
    return StructuredLogger(logging.getLogger(name))


def set_correlation_id(corr_id: Optional[str] = None) -> str:
    """
    Set the correlation ID for the current context.

    Parameters:
        corr_id: Optional correlation ID (generates one if not provided)

    Returns:
        The correlation ID that was set
    """
    if corr_id is None:
        corr_id = str(uuid.uuid4())
    correlation_id.set(corr_id)
    return corr_id


def get_correlation_id() -> Optional[str]:
    """Get the current correlation ID."""
    return correlation_id.get()


# Legacy function for backward compatibility
def log_trade(message: str) -> None:
    """
    Logs a trade message.

    Parameters:
        message (str): Message to log.
    """
    logger = get_logger('tradepilot.trading')
    logger.info(message)


# Default setup for backward compatibility (writes to pmt.log)
logging.basicConfig(
    filename="pmt.log",
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)
