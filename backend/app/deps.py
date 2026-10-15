from fastapi import Depends, HTTPException, Request
from sqlalchemy.orm import Session

import jwt

from .db import User, get_db
from .ratelimit import limiter
from .security import ACCESS_COOKIE, decode_token

SAFE = {"GET", "HEAD", "OPTIONS"}


def require_csrf(request: Request):
    """Cookies are sent automatically by browsers, so state-changing requests must carry a
    header that a cross-site form/image cannot set (plus SameSite=Lax on the cookies)."""
    if request.method not in SAFE and request.headers.get("x-requested-with") != "XMLHttpRequest":
        raise HTTPException(403, "Missing X-Requested-With header")


def current_user(request: Request, db: Session = Depends(get_db)) -> User:
    token = request.cookies.get(ACCESS_COOKIE)
    if not token:
        raise HTTPException(401, "Not signed in")
    try:
        uid = decode_token(token, "access")["sub"]
    except jwt.PyJWTError:
        raise HTTPException(401, "Session expired")
    user = db.get(User, uid)
    if not user:
        raise HTTPException(401, "Account not found")
    return user


def ai_rate_limit(user: User = Depends(current_user)):
    """AI calls cost money: 20 per minute per student."""
    wait = limiter.hit(f"ai:{user.id}", 20, 60)
    if wait:
        raise HTTPException(429, f"Slow down a little. Try again in {wait}s.", headers={"Retry-After": str(wait)})
    return user
