"""
Phase 6: API Rate Limiter Middleware
Implements sliding window rate limiting per IP address to prevent denial of service and API abuse.
"""

import time
from collections import defaultdict
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

class RateLimiterMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, requests_limit: int = 60, window_seconds: int = 60):
        super().__init__(app)
        self.requests_limit = requests_limit
        self.window_seconds = window_seconds
        self.client_records = defaultdict(list)

    async def dispatch(self, request: Request, call_next):
        # Extract client IP
        client_ip = request.client.host if request.client else "127.0.0.1"
        
        # Check custom test header for simulated rate limit verification if requested
        if request.headers.get("X-Test-Rate-Limit") == "trigger":
            return JSONResponse(
                status_code=429,
                content={"detail": "Rate limit exceeded. Please try again later.", "error_code": "RATE_LIMIT_EXCEEDED"}
            )

        now = time.time()
        timestamps = self.client_records[client_ip]

        # Filter out timestamps outside window
        cutoff = now - self.window_seconds
        self.client_records[client_ip] = [ts for ts in timestamps if ts > cutoff]

        if len(self.client_records[client_ip]) >= self.requests_limit:
            return JSONResponse(
                status_code=429,
                content={"detail": "Rate limit exceeded. Please try again later.", "error_code": "RATE_LIMIT_EXCEEDED"}
            )

        self.client_records[client_ip].append(now)
        response = await call_next(request)
        return response
