import { createContext, useContext, useState } from "react";
import { useApp } from "./AppContext";
import { api } from "../lib/api";
import { avg, clamp, toText } from "../lib/utils";

const Ctx = createContext(null);
export const usePractice = () => useContext(Ctx);

const initial = (user) => ({
  stage: "setup", // setup | interview | analysing | result
  role: user?.role || "",
  level: user?.level || "Mid",
  kind: "Mixed",
  total: 5,
  focus: [],
  context: "",
  history: [],
  turns: [],
  question: "",
  pending: "",
  result: null,
  busy: false,
  error: "",
});

const body = (p) => ({
  role: p.role, level: p.level, kind: p.kind, total_questions: p.total,
  history: p.history, focus: p.focus, context: p.context,
});

export function PracticeProvider({ children }) {
  const { user, sessions, addSession, toast } = useApp();
  const [P, setP] = useState(() => initial(user));
  const patch = (o) => setP((p) => ({ ...p, ...o }));
  const reset = (u = user) => setP(initial(u));

  async function start() {
    patch({ busy: true, error: "" });
    try {
      const r = await api("/api/start", body(P));
      patch({ stage: "interview", history: [], turns: [], question: toText(r.question), busy: false });
    } catch (e) {
      patch({ busy: false, error: e.message });
    }
  }

  async function finish(cur) {
    patch({ stage: "analysing", busy: true, pending: "", error: "" });
    let s = {};
    try {
      s = await api("/api/summary", body(cur));
    } catch {
      toast("Summary unavailable, saved with calculated score.");
    }
    const calc = Math.round(avg(cur.turns.map((t) => t.score)) * 10) / 10;
    const list = (v) => (Array.isArray(v) ? v : v ? [v] : []).map(toText);
    const draft = {
      role: cur.role, level: cur.level, kind: cur.kind, focus: cur.focus,
      overall: Math.round(clamp(+s.overall_score || calc, 0, 10) * 10) / 10,
      strengths: list(s.strengths), improvements: list(s.improvements),
      next_steps: toText(s.next_steps || ""), turns: cur.turns,
      prev: sessions.length ? avg(sessions.map((x) => x.overall)) : null,
    };
    try {
      const saved = await addSession(draft);
      patch({ stage: "result", result: saved, busy: false });
    } catch (e) {
      // keep the finished interview on screen even if saving failed
      patch({ stage: "result", result: { ...draft, id: "unsaved", date: new Date().toISOString() }, busy: false });
      toast("Could not save to your account: " + e.message);
    }
  }

  /** returns true if the answer was accepted (so the caller can clear its textarea) */
  async function send(text, secs = 0) {
    const cur = P;
    patch({ busy: true, error: "", pending: text });
    try {
      const r = await api("/api/answer", { ...body(cur), question: cur.question, answer: text });
      const turn = {
        q: cur.question, a: text, secs,
        words: text.split(/\s+/).filter(Boolean).length,
        score: clamp(Math.round(+r.score || 0), 0, 10),
        feedback: toText(r.feedback),
        skills: r.skills || null,
      };
      const turns = [...cur.turns, turn];
      const history = [...cur.history, { question: turn.q, answer: turn.a }];
      if (r.next_question && turns.length < cur.total) {
        patch({ turns, history, question: toText(r.next_question), pending: "", busy: false });
      } else {
        patch({ turns, history, pending: "" });
        await finish({ ...cur, turns, history });
      }
      return true;
    } catch (e) {
      patch({ busy: false, pending: "", error: e.message });
      return false;
    }
  }

  const endEarly = () => (P.turns.length ? finish(P) : reset());

  return <Ctx.Provider value={{ P, patch, reset, start, send, endEarly }}>{children}</Ctx.Provider>;
}
