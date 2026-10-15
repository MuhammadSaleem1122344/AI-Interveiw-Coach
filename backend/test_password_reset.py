import os
import tempfile

os.environ["DATABASE_URL"] = f"sqlite:///{os.path.join(tempfile.mkdtemp(), 'reset.db')}"
os.environ["SECRET_KEY"] = "test-password-reset-secret"
os.environ["GMAIL_USER"] = "sender@gmail.com"
os.environ["GMAIL_APP_PASSWORD"] = "test-app-password"

from fastapi.testclient import TestClient
import main
from app.routers import auth


def test_password_reset_sends_code_and_updates_password(monkeypatch):
    sent = {}
    monkeypatch.setattr(auth, "send_password_reset_email", lambda email, otp: sent.update(email=email, otp=otp))

    with TestClient(main.app) as client:
        headers = {"X-Requested-With": "XMLHttpRequest"}
        registered = client.post("/api/auth/register", headers=headers, json={
            "name": "Test Student", "email": "student@example.com", "password": "OriginalPass1", "role": "Developer"
        })
        assert registered.status_code == 200

        requested = client.post("/api/auth/password-reset/request", headers=headers, json={"email": "STUDENT@example.com"})
        assert requested.status_code == 200
        assert "If an account exists" in requested.json()["message"]
        assert sent["email"] == "student@example.com"
        assert len(sent["otp"]) == 6
        unknown = client.post("/api/auth/password-reset/request", headers=headers, json={"email": "unknown@example.com"})
        assert unknown.status_code == 200
        assert unknown.json() == requested.json()

        failed = client.post("/api/auth/password-reset/confirm", headers=headers, json={
            "email": "student@example.com", "otp": "000000", "password": "ResetPass2"
        })
        assert failed.status_code == 400

        reset = client.post("/api/auth/password-reset/confirm", headers=headers, json={
            "email": "student@example.com", "otp": sent["otp"], "password": "ResetPass2"
        })
        assert reset.status_code == 200 and reset.json() == {"ok": True}

        old_password = client.post("/api/auth/login", headers=headers, json={
            "email": "student@example.com", "password": "OriginalPass1"
        })
        new_password = client.post("/api/auth/login", headers=headers, json={
            "email": "student@example.com", "password": "ResetPass2"
        })
        assert old_password.status_code == 401
        assert new_password.status_code == 200