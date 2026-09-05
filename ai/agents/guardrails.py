"""
Phase 6: AI Safety & Financial Guardrails Engine
Handles prompt injection defense, PII redaction, and strict budget ceiling enforcement.
"""

import re
from typing import List, Dict, Any, Optional

class Guardrails:
    # Common prompt injection patterns (system overrides, price hacking, instruction breaking)
    INJECTION_PATTERNS = [
        r"ignore\s+(all\s+)?(previous\s+)?instructions",
        r"override\s+(system\s+)?prompt",
        r"system\s*:",
        r"you\s+are\s+now\s+a",
        r"(set|bring|change|make)\s+.*?\bprices?\b.*?\bto\s+0\b",
        r"(set|bring|change|make)\s+all\b.*?\bto\s+0\b",
        r"set\s+all?\s+prices?\s+to\s+0",
        r"make\s+everything\s+free",
        r"drop\s+table",
        r"delete\s+from",
        r"admin_mode"
    ]

    # Sensitive PII patterns (Credit card numbers, API keys, passwords)
    PII_PATTERNS = [
        (r"\b(?:\d[ -]*?){13,16}\b", "[REDACTED_CARD]"),
        (r"(?i)\b(password|secret|token|api_key)\s*[:=]\s*\S+", r"\1: [REDACTED]")
    ]

    @classmethod
    def is_prompt_injection(cls, text: str) -> bool:
        """
        Detects prompt injection attacks, price manipulation, or system override attempts.
        """
        if not text:
            return False
        for pattern in cls.INJECTION_PATTERNS:
            if re.search(pattern, text, re.IGNORECASE):
                return True
        return False

    @classmethod
    def sanitize_user_input(cls, text: str) -> str:
        """
        Sanitizes user query input to neutralize prompt injection attacks.
        Returns safe sanitized text.
        """
        if not text:
            return ""
        
        sanitized = text
        for pattern in cls.INJECTION_PATTERNS:
            if re.search(pattern, sanitized, re.IGNORECASE):
                sanitized = re.sub(pattern, "[Security Filtered]", sanitized, flags=re.IGNORECASE)

        return sanitized.strip()

    @classmethod
    def redact_pii(cls, text: str) -> str:
        """
        Redacts PII (credit cards, passwords, tokens) from text logs.
        """
        if not text:
            return ""

        redacted = text
        for pattern, replacement in cls.PII_PATTERNS:
            redacted = re.sub(pattern, replacement, redacted)

        return redacted

    @classmethod
    def enforce_budget_ceiling(
        cls, 
        products: List[Dict[str, Any]], 
        max_budget: Optional[float]
    ) -> List[Dict[str, Any]]:
        """
        Enforces financial boundary: filters out any recommended products that exceed max_budget.
        """
        if max_budget is None or max_budget <= 0:
            return products

        filtered = []
        for p in products:
            price = float(p.get("price", 0))
            if price <= max_budget:
                filtered.append(p)

        return filtered
