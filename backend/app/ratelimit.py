"""Small in-memory sliding-window rate limiter.

Fine for one process. With several workers/instances, back it with Redis instead
(same interface: `hit(key, limit, window)`).
"""
import threading
import time
from collections import defaultdict, deque

from fastapi import Depends, HTTPException, Request

from .config import settings


class RateLimiter:
    def __init__(self):
        self.enabled = True
        self._hits: dict[str, deque] = defaultdict(deque)
        self._lock = threading.Lock()

    def reset(self):
        with self._lock:
            self._hits.clear()

    def hit(self, key: str, limit: int, window: int) -> int:
        """Record a hit. Returns 0 if allowed, else the seconds until the next slot."""
        if not self.enabled:
            return 0
        now = time.monotonic()
        with self._lock:
            q = self._hits[key]
            while q and q[0] <= now - window:
                q.popleft()
            if len(q) >= limit:
                return int(window - (now - q[0])) + 1
            q.append(now)
            return 0


limiter = RateLimiter()


def client_ip(request: Request) -> str:
    if settings.trust_proxy:
        fwd = request.headers.get("x-forwarded-for")
        if fwd:
            return fwd.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def limit_by_ip(name: str, limit: int, window: int):
    def dep(request: Request):
        wait = limiter.hit(f"{name}:{client_ip(request)}", limit, window)
        if wait:
            raise HTTPException(429, f"Too many requests. Try again in {wait}s.", headers={"Retry-After": str(wait)})
    return Depends(dep)
