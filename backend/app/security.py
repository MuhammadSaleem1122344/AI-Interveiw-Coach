"""Password hashing, JWT access/refresh tokens and cookie helpers."""
import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Response

from .config import settings

ACCESS_COOKIE = "ic_access"
REFRESH_COOKIE = "ic_refresh"


# ---- passwords: "pbkdf2_sha256$iterations$salt$hash" (iterations can be raised later) ----
def _pbkdf2(password: str, salt: str, iters: int) -> str:
    return hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt), iters).hex()


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    n = settings.pbkdf2_iterations
    return f"pbkdf2_sha256${n}${salt}${_pbkdf2(password, salt, n)}"


def verify_password(password: str, stored: str) -> bool:
    try:
        _, iters, salt, digest = stored.split("$")
        return hmac.compare_digest(_pbkdf2(password, salt, int(iters)), digest)
    except (ValueError, TypeError):
        return False


_DUMMY = None


def burn_time(password: str) -> None:
    """Unknown email: do equivalent work so response time doesn't reveal which emails exist."""
    global _DUMMY
    if _DUMMY is None:
        _DUMMY = hash_password("dummy-password")
    verify_password(password, _DUMMY)


# ---- tokens ----
def _encode(payload: dict) -> str:
    return jwt.encode(payload, settings.secret_key, algorithm="HS256")


def create_access_token(uid: str) -> str:
    now = datetime.now(timezone.utc)
    return _encode({"sub": uid, "typ": "access", "iat": now, "exp": now + timedelta(minutes=settings.access_minutes)})


def create_refresh_token(uid: str) -> tuple[str, str, datetime]:
    jti = secrets.token_hex(16)
    exp = datetime.now(timezone.utc) + timedelta(days=settings.refresh_days)
    return _encode({"sub": uid, "typ": "refresh", "jti": jti, "exp": exp}), jti, exp


def decode_token(token: str, typ: str) -> dict:
    data = jwt.decode(token, settings.secret_key, algorithms=["HS256"])
    if data.get("typ") != typ:
        raise jwt.InvalidTokenError("wrong token type")
    return data


# ---- cookies (httpOnly: JavaScript can never read the tokens, so XSS can't steal them) ----
def set_auth_cookies(resp: Response, access: str, refresh: str) -> None:
    common = dict(httponly=True, samesite="lax", secure=settings.cookie_secure)
    resp.set_cookie(ACCESS_COOKIE, access, max_age=settings.access_minutes * 60, path="/", **common)
    resp.set_cookie(REFRESH_COOKIE, refresh, max_age=settings.refresh_days * 86400, path="/api/auth", **common)


def clear_auth_cookies(resp: Response) -> None:
    resp.delete_cookie(ACCESS_COOKIE, path="/")
    resp.delete_cookie(REFRESH_COOKIE, path="/api/auth")
