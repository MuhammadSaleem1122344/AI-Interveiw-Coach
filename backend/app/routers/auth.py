import hashlib
import hmac
import re
import secrets
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from .. import security
from ..config import settings
from ..db import PasswordReset, RefreshToken, User, aware, get_db, now
from ..deps import current_user
from ..email import send_password_reset_email
from ..ratelimit import limit_by_ip
from ..schemas import LoginReq, PasswordResetConfirm, PasswordResetRequest, ProfileUpdate, RegisterReq

router = APIRouter(prefix="/api")
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def user_out(u: User) -> dict:
    return {"id": u.id, "email": u.email, "created": aware(u.created).isoformat(), **u.profile}


def start_session(resp: Response, db: Session, user: User) -> None:
    refresh, jti, exp = security.create_refresh_token(user.id)
    db.add(RefreshToken(jti=jti, user_id=user.id, expires=exp))
    db.commit()
    security.set_auth_cookies(resp, security.create_access_token(user.id), refresh)


@router.post("/auth/register", dependencies=[limit_by_ip("register", 5, 3600)])
def register(r: RegisterReq, resp: Response, db: Session = Depends(get_db)):
    email = r.email.strip().lower()
    if not EMAIL_RE.match(email):
        raise HTTPException(422, "Enter a valid email address")
    user = User(
        email=email, pw_hash=security.hash_password(r.password),
        profile={"name": r.name.strip(), "role": r.role.strip(), "level": r.level, "goal": r.goal,
                 "weekly": r.weekly, "color": r.color, "theme": "auto"},
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "An account with this email already exists")
    start_session(resp, db, user)
    return {"user": user_out(user)}


@router.post("/auth/login", dependencies=[limit_by_ip("login", 10, 60)])
def login(r: LoginReq, resp: Response, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == r.email.strip().lower()))
    if not user:
        security.burn_time(r.password)
    if not user or not security.verify_password(r.password, user.pw_hash):
        raise HTTPException(401, "Incorrect email or password")
    start_session(resp, db, user)
    return {"user": user_out(user)}


def _otp_digest(email: str, otp: str) -> str:
    return hmac.new(settings.secret_key.encode(), f"{email}:{otp}".encode(), hashlib.sha256).hexdigest()


@router.post("/auth/password-reset/request", dependencies=[limit_by_ip("password_reset", 5, 900)])
def request_password_reset(r: PasswordResetRequest, db: Session = Depends(get_db)):
    email = r.email.strip().lower()
    if not EMAIL_RE.match(email):
        raise HTTPException(422, "Enter a valid email address")

    if not settings.gmail_user or not settings.gmail_app_password:
        raise HTTPException(503, "Password reset email is not configured on the server")
    user = db.scalar(select(User).where(User.email == email))
    if user:
        otp = f"{secrets.randbelow(1_000_000):06d}"
        row = db.get(PasswordReset, email)
        if row:
            row.otp_hash = _otp_digest(email, otp)
            row.expires_at = now() + timedelta(minutes=10)
            row.attempts = 0
        else:
            row = PasswordReset(email=email, otp_hash=_otp_digest(email, otp), expires_at=now() + timedelta(minutes=10))
            db.add(row)
        db.commit()
        try:
            send_password_reset_email(email, otp)
        except Exception:
            db.delete(row)
            db.commit()
            raise HTTPException(503, "Could not send the reset email. Please try again later")

    return {"message": "If an account exists for that email, a reset code has been sent."}


@router.post("/auth/password-reset/confirm", dependencies=[limit_by_ip("password_reset_confirm", 10, 900)])
def confirm_password_reset(r: PasswordResetConfirm, db: Session = Depends(get_db)):
    email = r.email.strip().lower()
    reset = db.get(PasswordReset, email)
    if not reset:
        raise HTTPException(400, "Invalid or expired reset code")
    if aware(reset.expires_at) < datetime.now(timezone.utc):
        db.delete(reset)
        db.commit()
        raise HTTPException(400, "Invalid or expired reset code")
    if reset.attempts >= 5:
        db.delete(reset)
        db.commit()
        raise HTTPException(400, "Too many incorrect codes. Request a new one")
    if not hmac.compare_digest(reset.otp_hash, _otp_digest(email, r.otp.strip())):
        reset.attempts += 1
        db.commit()
        raise HTTPException(400, "Invalid or expired reset code")

    categories = [r.password.lower() != r.password, r.password.upper() != r.password,
                  any(char.isdigit() for char in r.password), any(not char.isalnum() for char in r.password)]
    if sum(categories) < 2:
        raise HTTPException(422, "Use a strong password with at least 8 characters and at least two character types")

    user = db.scalar(select(User).where(User.email == email))
    if not user:
        db.delete(reset)
        db.commit()
        raise HTTPException(400, "Invalid or expired reset code")
    user.pw_hash = security.hash_password(r.password)
    db.execute(update(RefreshToken).where(RefreshToken.user_id == user.id).values(revoked=True))
    db.delete(reset)
    db.commit()
    return {"ok": True}


@router.post("/auth/refresh", dependencies=[limit_by_ip("refresh", 60, 60)])
def refresh(request: Request, resp: Response, db: Session = Depends(get_db)):
    """Rotate the refresh token. Re-using an old one revokes every session of that account."""
    token = request.cookies.get(security.REFRESH_COOKIE)
    if not token:
        raise HTTPException(401, "Not signed in")
    try:
        data = security.decode_token(token, "refresh")
    except jwt.PyJWTError:
        security.clear_auth_cookies(resp)
        raise HTTPException(401, "Session expired")
    row = db.get(RefreshToken, data["jti"])
    if not row or aware(row.expires) < datetime.now(timezone.utc):
        raise HTTPException(401, "Session expired")
    if row.revoked:  # token reuse => likely stolen: kill all sessions for this user
        db.execute(update(RefreshToken).where(RefreshToken.user_id == row.user_id).values(revoked=True))
        db.commit()
        security.clear_auth_cookies(resp)
        raise HTTPException(401, "Session expired")
    user = db.get(User, row.user_id)
    if not user:
        raise HTTPException(401, "Account not found")
    row.revoked = True
    db.commit()
    start_session(resp, db, user)
    return {"user": user_out(user)}


@router.post("/auth/logout")
def logout(request: Request, resp: Response, db: Session = Depends(get_db)):
    token = request.cookies.get(security.REFRESH_COOKIE)
    if token:
        try:
            row = db.get(RefreshToken, security.decode_token(token, "refresh")["jti"])
            if row:
                row.revoked = True
                db.commit()
        except jwt.PyJWTError:
            pass
    security.clear_auth_cookies(resp)
    return {"ok": True}


@router.get("/me")
def me(user: User = Depends(current_user)):
    return user_out(user)


@router.put("/me")
def update_me(p: ProfileUpdate, user: User = Depends(current_user), db: Session = Depends(get_db)):
    user.profile = {**user.profile, **p.model_dump(exclude_none=True)}  # new dict so SQLAlchemy sees the change
    db.commit()
    return user_out(user)


@router.delete("/me")
def delete_me(resp: Response, user: User = Depends(current_user), db: Session = Depends(get_db)):
    db.delete(user)  # interviews + refresh tokens go with it (ON DELETE CASCADE)
    db.commit()
    security.clear_auth_cookies(resp)
    return {"ok": True}
