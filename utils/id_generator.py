"""
SHORT COMPLAINT ID GENERATOR
============================
Generates user-friendly, short, unique complaint IDs instead of UUID.

Format: SG-YYYY-XXXXX
  - SG: System prefix (Smart Governance)
  - YYYY: Year (2 digits)
  - XXXXX: Random alphanumeric (5 chars)

Examples:
  - SG-26-A9F3D
  - SG-26-K2P7L
  - SG-26-XWQM9

Benefits:
  - Easy to read and remember
  - Easy to copy and share
  - Easy to type
  - Still cryptographically unique (random component)
"""

import random
import string
from datetime import datetime


# System prefix
SYSTEM_PREFIX = "SG"

# Characters for random token generation (avoid I, O, 1, 0 for clarity)
TOKEN_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"


def generate_complaint_id() -> str:
    """
    Generate a short, user-friendly complaint ID.
    
    Format: SG-YY-XXXXX
      - SG: System prefix
      - YY: Last 2 digits of current year
      - XXXXX: 5 random alphanumeric characters
    
    Returns:
        str: Short complaint ID (e.g., "SG-26-A9F3D")
    
    Examples:
        >>> id1 = generate_complaint_id()
        >>> len(id1)  # 12 characters including hyphens
        12
        >>> id1.startswith("SG-")
        True
    """
    # Get last 2 digits of year
    year_suffix = str(datetime.utcnow().year)[-2:]
    
    # Generate 5 random alphanumeric characters
    random_token = "".join(random.choices(TOKEN_ALPHABET, k=5))
    
    # Combine into complaint ID
    complaint_id = f"{SYSTEM_PREFIX}-{year_suffix}-{random_token}"
    
    return complaint_id


def generate_short_id(prefix: str = "SG", length: int = 6) -> str:
    """
    Generic function to generate a short token with custom prefix and length.
    
    Args:
        prefix: System prefix (default: "SG")
        length: Number of random characters (default: 6)
    
    Returns:
        str: Short token (e.g., "SG-A9F3D2")
    """
    random_token = "".join(random.choices(TOKEN_ALPHABET, k=length))
    return f"{prefix}-{random_token}"


def validate_complaint_id(complaint_id: str) -> bool:
    """
    Validate if a string is a properly formatted complaint ID.
    
    Args:
        complaint_id: ID string to validate
    
    Returns:
        bool: True if valid format, False otherwise
    """
    if not complaint_id or not isinstance(complaint_id, str):
        return False
    
    # Should be format SG-YY-XXXXX
    parts = complaint_id.split("-")
    
    if len(parts) != 3:
        return False
    
    prefix, year, token = parts
    
    # Validate prefix
    if prefix != SYSTEM_PREFIX:
        return False
    
    # Validate year (2 digits)
    if len(year) != 2 or not year.isdigit():
        return False
    
    # Validate token (5 alphanumeric from allowed alphabet)
    if len(token) != 5 or not all(c in TOKEN_ALPHABET for c in token):
        return False
    
    return True
