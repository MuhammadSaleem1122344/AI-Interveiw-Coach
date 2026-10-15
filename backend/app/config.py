"""Central configuration, read once from the environment (.env supported)."""
import os
import secrets
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv

BASE = Path(__file__).resolve().parent.parent
load_dotenv(BASE / ".env")


def _bool(name: str, default: bool = False) -> bool:
    return os.getenv(name, str(default)).strip().lower() in ("1", "true", "yes", "on")


def _secret(env: str) -> str:
    key = os.getenv("SECRET_KEY", "").strip()
    if key:
        return key
    if env == "production":
        raise RuntimeError("SECRET_KEY must be set when ENV=production")
    f = BASE / ".secret_key"  # dev convenience: persisted so logins survive restarts
    if f.exists():
        return f.read_text().strip()
    key = secrets.token_hex(32)
    try:
        f.write_text(key)
    except OSError:
        pass
    return key


@dataclass(frozen=True)
class Settings:
    env: str
    database_url: str
    secret_key: str
    gemini_api_key: str
    gmail_user: str
    gmail_app_password: str
    gmail_from: str
    smtp_host: str
    smtp_port: int
    gemini_models: tuple
    cookie_secure: bool
    cors_origins: tuple
    trust_proxy: bool
    access_minutes: int = 15
    refresh_days: int = 14
    pbkdf2_iterations: int = 600_000
    frontend_dist: Path = BASE.parent / "frontend" / "dist"


def load() -> Settings:
    env = os.getenv("ENV", "development").strip().lower()
    return Settings(
        env=env,
        database_url=os.getenv("DATABASE_URL", f"sqlite:///{BASE / 'app.db'}"),
        secret_key=_secret(env),
        gemini_api_key=os.getenv("GEMINI_API_KEY", ""),
            gmail_user=os.getenv("GMAIL_USER", "").strip(),
            gmail_app_password=os.getenv("GMAIL_APP_PASSWORD", "").replace(" ", ""),
            gmail_from=os.getenv("GMAIL_FROM", "").strip(),
            smtp_host=os.getenv("SMTP_HOST", "smtp.gmail.com").strip(),
            smtp_port=int(os.getenv("SMTP_PORT", "587")),
        gemini_models=tuple(
            m.strip()
            for m in os.getenv("GEMINI_MODELS", "gemini-3.5-flash,gemini-3.5-flash-lite,gemini-3.1-flash-lite").split(",")
            if m.strip()
        ),
        cookie_secure=_bool("COOKIE_SECURE", env == "production"),
        cors_origins=tuple(o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",") if o.strip()),
        trust_proxy=_bool("TRUST_PROXY"),
        pbkdf2_iterations=int(os.getenv("PBKDF2_ITERATIONS", "600000")),
    )


settings = load()
