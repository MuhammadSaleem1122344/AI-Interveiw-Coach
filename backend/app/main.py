"""Application factory: middleware (request id + JSON access log, security headers, CORS),
migrations on startup, routers, health checks and the built React app."""
import json
import logging
import sys
import time
import uuid
from contextlib import asynccontextmanager
from pathlib import Path

from alembic import command
from alembic.config import Config
from fastapi import Depends, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text
from sqlalchemy.orm import Session

from .config import BASE, settings
from .db import get_db
from .deps import require_csrf
from .routers import auth, coach, interviews

logging.basicConfig(level=logging.INFO, stream=sys.stdout, format="%(message)s")
log = logging.getLogger("app")


def run_migrations() -> None:
    cfg = Config(str(BASE / "alembic.ini"))
    cfg.set_main_option("script_location", str(BASE / "migrations"))
    cfg.attributes["configure_logger"] = False  # don't let alembic.ini replace our logging setup
    command.upgrade(cfg, "head")


@asynccontextmanager
async def lifespan(_: FastAPI):
    run_migrations()
    log.info(json.dumps({"event": "startup", "env": settings.env, "models": settings.gemini_models}))
    yield


def create_app() -> FastAPI:
    app = FastAPI(title="AI Interview Coach", lifespan=lifespan, dependencies=[Depends(require_csrf)],
                  docs_url=None if settings.env == "production" else "/docs", redoc_url=None)

    app.add_middleware(CORSMiddleware, allow_origins=list(settings.cors_origins), allow_credentials=True,
                       allow_methods=["*"], allow_headers=["*"])

    @app.middleware("http")
    async def observe(request: Request, call_next):
        rid = request.headers.get("x-request-id") or uuid.uuid4().hex[:12]
        t0 = time.perf_counter()
        try:
            resp = await call_next(request)
        except Exception:
            log.exception(json.dumps({"event": "unhandled", "rid": rid, "path": request.url.path}))
            resp = JSONResponse({"detail": "Internal server error"}, status_code=500)
        resp.headers["X-Request-ID"] = rid
        resp.headers["X-Content-Type-Options"] = "nosniff"
        resp.headers["X-Frame-Options"] = "DENY"
        resp.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        resp.headers["Content-Security-Policy"] = (
            "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'"
        )
        if settings.cookie_secure:
            resp.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        if request.url.path.startswith("/api/"):
            resp.headers["Cache-Control"] = "no-store"
            log.info(json.dumps({"event": "request", "rid": rid, "method": request.method, "path": request.url.path,
                                 "status": resp.status_code, "ms": round((time.perf_counter() - t0) * 1000, 1)}))
        return resp

    @app.get("/api/health")
    def health():
        return {"ok": True}

    @app.get("/api/ready")
    def ready(db: Session = Depends(get_db)):
        db.execute(text("SELECT 1"))
        return {"ok": True, "ai_configured": bool(settings.gemini_api_key)}

    app.include_router(auth.router)
    app.include_router(interviews.router)
    app.include_router(coach.router)

    dist: Path = settings.frontend_dist
    if dist.exists():
        app.mount("/", StaticFiles(directory=dist, html=True), name="web")
    else:
        @app.get("/")
        def root():
            return {"message": "API is running. Start the UI with `npm run dev` inside /frontend."}

    return app


app = create_app()
