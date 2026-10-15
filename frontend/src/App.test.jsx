import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import App from "./App.jsx";
import { setToken } from "./lib/api";

// ---- in-memory fake of the FastAPI backend (accounts + per-student data) ----
function fakeServer() {
  const users = {}, sessions = {};
  let n = 0;
  const resetOtp = "123456";
  const json = (data, status = 200) => { const copy = JSON.parse(JSON.stringify(data)); return { ok: status < 400, status, json: async () => copy, text: async () => JSON.stringify(copy) }; };
  return async (url, opt = {}) => {
    const path = url.replace(/^.*\/api/, "/api");
    const m = opt.method || "GET";
    const body = opt.body ? JSON.parse(opt.body) : {};
    const tok = (opt.headers?.Authorization || "").replace("Bearer ", "");
    const uid = tok.startsWith("tok-") ? tok.slice(4) : null;
    if (path === "/api/auth/register") {
      if (Object.values(users).some((u) => u.email === body.email)) return json({ detail: "An account with this email already exists" }, 409);
      const id = "u" + ++n;
      users[id] = { id, email: body.email, password: body.password, created: new Date().toISOString(), theme: "auto", name: body.name, role: body.role, level: body.level, goal: body.goal, weekly: body.weekly, color: body.color };
      sessions[id] = [];
      return json({ token: "tok-" + id, user: users[id] });
    }
    if (path === "/api/auth/login") {
      const u = Object.values(users).find((x) => x.email === body.email);
      return u && u.password === body.password ? json({ token: "tok-" + u.id, user: u }) : json({ detail: "Incorrect email or password" }, 401);
    }
    if (path === "/api/auth/password-reset/request") {
      return json({ message: "If an account exists for that email, a reset code has been sent." });
    }
    if (path === "/api/auth/password-reset/confirm") {
      const u = Object.values(users).find((x) => x.email === body.email);
      if (!u || body.otp !== resetOtp) return json({ detail: "Invalid or expired reset code" }, 400);
      u.password = body.password;
      return json({ ok: true });
    }
    if (!uid || !users[uid]) return json({ detail: "Not signed in" }, 401);
    if (path === "/api/me" && m === "GET") return json(users[uid]);
    if (path === "/api/sessions" && m === "GET") return json(sessions[uid]);
    if (path === "/api/sessions" && m === "POST") { const s = { ...body, id: "s" + ++n, date: new Date().toISOString() }; sessions[uid].push(s); return json(s); }
    if (path === "/api/start") return json({ question: "Explain closures." });
    if (path === "/api/answer") {
      const last = body.history.length + 1 >= body.total_questions;
      return json({ feedback: "Good use of an example.", score: 8, skills: { communication: 8, technical_depth: 7, structure: 6, clarity: 9 }, next_question: last ? null : "Explain hoisting." });
    }
    if (path === "/api/summary") return json({ overall_score: 7.5, strengths: ["Clear examples"], improvements: ["Add metrics"], next_steps: "Practise STAR." });
    return json({ detail: "not found" }, 404);
  };
}

beforeEach(() => {
  localStorage.clear(); setToken("");
  document.documentElement.className = "";
  window.location.hash = "";
  globalThis.fetch = vi.fn(fakeServer());
  window.matchMedia = window.matchMedia || ((q) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} }));
  window.HTMLElement.prototype.scrollIntoView = () => {};
  window.confirm = () => true;
});

async function signUp(name, email) {
  render(<App />);
  fireEvent.change(await screen.findByLabelText("Your name"), { target: { value: name } });
  fireEvent.change(screen.getByLabelText("Role you are preparing for"), { target: { value: "Java Developer" } });
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: email } });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: "password123" } });
  fireEvent.click(screen.getByRole("button", { name: "Create account" }));
  await screen.findByText(/No interviews yet/);
}

describe("Interview Coach app", () => {
  it("validates the sign-up form", async () => {
    render(<App />);
    fireEvent.click(await screen.findByRole("button", { name: "Create account" }));
    expect((await screen.findByRole("alert")).textContent).toContain("Enter your name");
  });

  it("rejects invalid email and weak password before opening the dashboard", async () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText("Your name"), { target: { value: "Sam" } });
    fireEvent.change(screen.getByLabelText("Role you are preparing for"), { target: { value: "Backend Dev" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "not-an-email" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "weak" } });
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    expect((await screen.findByRole("alert")).textContent).toContain("valid email");

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "sam@example.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "weak" } });
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));
    expect((await screen.findByRole("alert")).textContent).toContain("strong password");
  });

  it("full flow: sign up, interview, result, history, sign out, separate second student", async () => {
    await signUp("Muhammad Saleem", "a@x.com");
    expect(screen.getByText("Muhammad")).toBeTruthy();

    fireEvent.click(screen.getAllByText("Practice")[0]);
    fireEvent.click(await screen.findByRole("button", { name: "3" }));
    fireEvent.click(screen.getByRole("button", { name: "Fundamentals" }));
    fireEvent.click(screen.getByRole("button", { name: "Start interview" }));
    await screen.findByText("Explain closures.");

    for (let i = 0; i < 3; i++) {
      fireEvent.change(screen.getByPlaceholderText(/Type your answer/), { target: { value: "My answer " + i } });
      fireEvent.click(screen.getByRole("button", { name: "Send answer" }));
      if (i < 2) {
        await waitFor(() => expect(screen.getAllByText(/Good use of an example/).length).toBe(i + 1));
        await waitFor(() => expect(screen.getAllByText("Explain hoisting.").length).toBeGreaterThan(0));
      }
    }
    await screen.findByText(/Interview complete/);
    expect(screen.getByText("What worked")).toBeTruthy();
    expect(screen.getByText("Clear examples")).toBeTruthy();

    // the interview was saved to the account
    const posts = globalThis.fetch.mock.calls.filter(([u, o]) => u.endsWith("/api/sessions") && o?.method === "POST");
    expect(posts.length).toBe(1);

    fireEvent.click(screen.getAllByText("History")[0]);
    await screen.findByText(/1 saved interview/);

    // sign out -> auth screen; second student must see an empty account
    fireEvent.click(screen.getAllByText("Profile")[0]);
    await screen.findByText("Your account");
    fireEvent.click(screen.getAllByRole("button", { name: "Sign out" }).at(-1));
    await screen.findByRole("button", { name: "Create account" });
    fireEvent.change(screen.getByLabelText("Your name"), { target: { value: "Sara Khan" } });
    fireEvent.change(screen.getByLabelText("Role you are preparing for"), { target: { value: "React Dev" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "b@x.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));
    await screen.findByText(/No interviews yet/);
    expect(screen.getByText("Sara")).toBeTruthy();
  });

  it("handles forgot password with OTP reset", async () => {
    await globalThis.fetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name: "Reset User", role: "Developer", email: "reset@example.com", password: "OriginalPass1" }),
    });
    render(<App />);
    fireEvent.click(await screen.findByRole("button", { name: "login" }));
    fireEvent.click(await screen.findByRole("button", { name: "Forgot password?" }));
    await screen.findByRole("heading", { name: "Reset your password" });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "reset@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Send reset code" }));

    expect(await screen.findByText("If an account exists for that email, a reset code has been sent.")).toBeTruthy();
    expect(localStorage.getItem("ic.forgot")).toBeNull();
    expect(screen.queryByText(/Use code/)).toBeNull();

    fireEvent.change(await screen.findByLabelText("OTP code"), { target: { value: "123456" } });
    fireEvent.change(screen.getByLabelText("New password"), { target: { value: "ResetPass1" } });
    fireEvent.click(screen.getByRole("button", { name: "Reset password" }));

    expect(await screen.findByText("Password updated. Sign in with your new password.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeTruthy();
  });

  it("shows server errors on sign-in", async () => {
    render(<App />);
    fireEvent.click(await screen.findByRole("button", { name: "login" }));
    await screen.findByRole("heading", { name: "Welcome back" });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "nobody@x.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "whatever1" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect((await screen.findByRole("alert")).textContent).toContain("Incorrect email or password");
  });

  it("restores the session after a reload", async () => {
    await signUp("Ali Raza", "r@x.com");
    document.body.innerHTML = "";
    render(<App />);
    expect(await screen.findByText("Ali")).toBeTruthy();
  });
});
