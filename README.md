# AI Interview Coach — React + Tailwind + FastAPI + SQL

Every student has their **own account**; interview questions are generated **per student**
(role, level, weak areas from past interviews, focus topics, optional job description/CV, and
questions they were already asked are excluded).

## Architecture
```
React (Vite, Tailwind, Router)  ──cookies──▶  FastAPI  ──SQLAlchemy/Alembic──▶  SQLite | PostgreSQL
                                                 └──▶ Gemini (retry + model fallback)
```
| Concern | How it is handled |
|---|---|
| Auth | PBKDF2-SHA256 (600k iterations, versioned hash format), 15-min access JWT + 14-day refresh JWT in **httpOnly, SameSite=Lax** cookies (no token in JS / localStorage) |
| Sessions | Refresh tokens are stored, **rotated** on use, **revoked** on logout; re-using an old one revokes the whole account's sessions |
| CSRF | SameSite cookies + required `X-Requested-With` header on every write |
| Abuse | Rate limits: login 10/min, register 5/hour (per IP), AI calls 20/min (per student) |
| Data isolation | Every query is scoped to the signed-in user; covered by tests |
| Database | SQLAlchemy 2.0 models, **Alembic migrations run on startup**, FK cascade on account delete |
| Observability | JSON access log with request id (`X-Request-ID`), `/api/health`, `/api/ready` (checks DB) |
| Hardening | CSP, `X-Frame-Options`, `nosniff`, HSTS (when `COOKIE_SECURE=true`), `/docs` disabled in production, no internal errors leaked |
| AI | Per-student prompt, prompt-injection-aware (CV/JD treated as data), output normalised and validated |
| Delivery | Multi-stage `Dockerfile` (non-root, healthcheck), `docker-compose.yml` with Postgres, GitHub Actions CI |

## Run (no Node needed — UI is pre-built in `frontend/dist`)
```bash
cd backend
py -m pip install -r requirements.txt
copy .env.example .env          # add GEMINI_API_KEY
py -m uvicorn main:app --port 8000      # http://localhost:8000
```
## Develop with hot reload
```bash
cd backend && py -m uvicorn main:app --reload --port 8000
cd frontend && npm install && npm run dev        # http://localhost:5173 (proxies /api)
```
## Docker (Postgres)
```bash
# .env next to docker-compose.yml:  SECRET_KEY=<long random>  GEMINI_API_KEY=<key>
docker compose up --build        # http://localhost:8000
```
Set `COOKIE_SECURE=true` and `TRUST_PROXY=true` once it sits behind HTTPS / a reverse proxy.

To send password reset codes through Gmail, enable 2-Step Verification on the sending Google account,
create an App Password, and set `GMAIL_USER` and `GMAIL_APP_PASSWORD` in `backend/.env`. Never use
your normal Google password or put mail credentials in the frontend.

## Tests
```bash
cd backend && pip install -r requirements-dev.txt && pytest -q     # 17 tests: auth, rotation, CSRF, rate limits, isolation
cd frontend && npm test                                            # 8 tests: UI flow, silent refresh, single-flight refresh
```
## Known limits (honest list)
- Rate limiter is in-memory (one process). With several instances, move it to Redis.
- Password reset email delivery requires Gmail SMTP credentials configured on the backend.
- Verified on SQLite; the PostgreSQL + Docker setup is written but not run in this environment.
- Old v1 data (`data.db`) is not migrated: this version uses `app.db` and a new schema.
