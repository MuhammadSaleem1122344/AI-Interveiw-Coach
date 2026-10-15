import os, tempfile
os.environ["DB_PATH"] = os.path.join(tempfile.mkdtemp(), "t.db")
os.environ["SECRET_KEY"] = "test-secret"

from fastapi.testclient import TestClient
import main

calls = []

def fake_ai(system, user):
    calls.append((system, user))
    if "Start the interview" in user:
        return {"question": "What is a closure?"}
    if "Current question" in user:
        return {"feedback": {"good": "x"}, "score": "8", "skills": {"communication": 9}, "next_question": "Next?"}
    return {"overall_score": 7.4, "strengths": ["a"], "improvements": ["b"], "next_steps": "c"}

main.ask_ai = fake_ai
c = TestClient(main.app)

def reg(email, name="Ali"):
    r = c.post("/api/auth/register", json={"name": name, "email": email, "password": "password123", "role": "Java Dev"})
    assert r.status_code == 200, r.text
    return r.json()

def H(t): return {"Authorization": f"Bearer {t}"}

def test_auth_flow_and_errors():
    a = reg("a@x.com")
    assert c.post("/api/auth/register", json={"name": "A", "email": "A@x.com", "password": "password123", "role": "r"}).status_code == 409
    assert c.post("/api/auth/login", json={"email": "a@x.com", "password": "wrong"}).status_code == 401
    ok = c.post("/api/auth/login", json={"email": "A@X.com", "password": "password123"})
    assert ok.status_code == 200 and ok.json()["user"]["name"] == "Ali"
    assert c.get("/api/me").status_code == 401
    assert c.get("/api/me", headers=H("garbage")).status_code == 401
    assert c.get("/api/me", headers=H(a["token"])).json()["email"] == "a@x.com"
    assert c.post("/api/auth/register", json={"name": "A", "email": "bad", "password": "password123", "role": "r"}).status_code == 422

def test_students_are_isolated():
    a, b = reg("iso1@x.com"), reg("iso2@x.com", "Sara")
    s = {"overall": 7, "turns": [{"q": "Q-A-only", "a": "x", "score": 7}], "improvements": ["weak-A"], "kind": "Mixed"}
    saved = c.post("/api/sessions", json=s, headers=H(a["token"])).json()
    assert len(c.get("/api/sessions", headers=H(a["token"])).json()) == 1
    assert c.get("/api/sessions", headers=H(b["token"])).json() == []
    assert c.delete(f"/api/sessions/{saved['id']}", headers=H(b["token"])).status_code == 404
    assert len(c.get("/api/sessions", headers=H(a["token"])).json()) == 1
    # personalisation: A's past questions/weak areas reach A's prompt, never B's
    body = {"role": "Java Dev", "level": "Mid", "kind": "Mixed", "total_questions": 3, "focus": ["Streams"], "context": "JD text"}
    c.post("/api/start", json=body, headers=H(a["token"]))
    sys_a = calls[-1][0]
    assert "Q-A-only" in sys_a and "weak-A" in sys_a and "Streams" in sys_a and "JD text" in sys_a
    c.post("/api/start", json=body, headers=H(b["token"]))
    assert "Q-A-only" not in calls[-1][0]

def test_ai_endpoints_need_login_and_normalise():
    assert c.post("/api/start", json={"role": "r"}).status_code == 401
    t = reg("ai@x.com")["token"]
    r = c.post("/api/answer", headers=H(t), json={"role": "r", "total_questions": 2, "question": "Q", "answer": "A", "history": []}).json()
    assert r["score"] == 8 and isinstance(r["feedback"], str) and r["skills"]["communication"] == 9 and r["skills"]["clarity"] == 8
    assert r["next_question"] == "Next?"
    last = c.post("/api/answer", headers=H(t), json={"role": "r", "total_questions": 1, "question": "Q", "answer": "A", "history": []}).json()
    assert last["next_question"] is None
    s = c.post("/api/summary", headers=H(t), json={"role": "r", "history": [{"question": "q", "answer": "a"}]}).json()
    assert s["overall_score"] == 7

def test_profile_update_and_delete():
    t = reg("p@x.com")["token"]
    u = c.put("/api/me", headers=H(t), json={"goal": 9, "theme": "dark"}).json()
    assert u["goal"] == 9 and u["theme"] == "dark" and u["name"] == "Ali"
    assert c.delete("/api/me", headers=H(t)).status_code == 200
    assert c.get("/api/me", headers=H(t)).status_code == 401
