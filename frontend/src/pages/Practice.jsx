import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { ArrowUpRight, Check, CheckCircle2, ClipboardList, Mic, MicOff, RotateCcw, Send, Sparkles, Target } from "lucide-react";
import Bar from "../components/Bar";
import Radar from "../components/Radar";
import Seg from "../components/Seg";
import { CountUp } from "../hooks/useCountUp";
import { useSpeech } from "../hooks/useSpeech";
import { useApp } from "../context/AppContext";
import { usePractice } from "../context/PracticeContext";
import { fmt, scoreColor, scoreWord } from "../lib/utils";
import { SKILL_LABELS } from "../lib/analytics";

const TOPICS = ["Fundamentals", "System design", "Debugging", "Problem solving", "Teamwork", "Leadership", "Communication", "Past projects"];

/* ---------------------------------- setup --------------------------------- */
function Setup() {
  const { P, patch, start } = usePractice();
  const [custom, setCustom] = useState("");
  const toggle = (t) => patch({ focus: P.focus.includes(t) ? P.focus.filter((x) => x !== t) : [...P.focus, t].slice(0, 8) });
  const addCustom = () => {
    const t = custom.trim().slice(0, 40);
    if (t && !P.focus.includes(t)) patch({ focus: [...P.focus, t].slice(0, 8) });
    setCustom("");
  };
  return (
    <motion.div className="mx-auto max-w-[720px]" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}>
      <motion.header className="mb-5" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04, duration: 0.3 }}>
        <p className="mb-2 text-xs font-bold uppercase tracking-[.14em] text-muted">Interview setup</p>
        <h1>Practice <span className="mark">interview</span></h1>
        <p className="sub">Questions are generated for you: your role, level, weak areas, and nothing you were asked before.</p>
      </motion.header>
      <motion.div className="card gradient-panel" initial={{ opacity: 0, y: 18, scale: 0.99 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.08, duration: 0.38, ease: [0.22, 1, 0.36, 1] }}>
        <div className="mb-5 flex items-center gap-3 border-b border-line pb-4">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-card text-cobalt shadow-sm"><Sparkles size={19} aria-hidden="true" /></span>
          <div><h2>Build your practice session</h2><p className="text-sm text-muted">Tune each interview to your next opportunity.</p></div>
        </div>
        <div className="mb-4">
          <label className="label" htmlFor="p-role">Role</label>
          <input id="p-role" className="input" maxLength={60} value={P.role} onChange={(e) => patch({ role: e.target.value })} />
        </div>
        <div className="mb-4"><span className="label">Level</span><Seg label="Level" options={["Junior", "Mid", "Senior"]} value={P.level} onChange={(level) => patch({ level })} /></div>
        <div className="mb-4"><span className="label">Question type</span><Seg label="Question type" options={["Behavioral", "Technical", "Mixed"]} value={P.kind} onChange={(kind) => patch({ kind })} /></div>
        <div className="mb-4"><span className="label">Number of questions</span><Seg label="Number of questions" options={[3, 5, 8]} value={P.total} onChange={(total) => patch({ total: +total })} /></div>

        <div className="mb-4">
          <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2"><span className="label !mb-0">Focus topics <span className="font-normal text-muted">(optional)</span></span><span className="text-xs font-semibold text-muted">{P.focus.length}/8 selected</span></div>
          <div className="mb-2 flex flex-wrap gap-2">
            {[...TOPICS, ...P.focus.filter((f) => !TOPICS.includes(f))].map((t) => {
              const on = P.focus.includes(t);
              return <motion.button layout key={t} type="button" aria-pressed={on} onClick={() => toggle(t)} whileTap={{ scale: 0.96 }} transition={{ duration: 0.18 }}
                className={`inline-flex min-h-10 items-center gap-1.5 rounded-full border-[1.5px] px-3.5 py-1.5 text-sm transition-colors ${on ? "border-cobalt bg-cobalt/15 font-semibold text-cobalt" : "border-line bg-card hover:border-cobalt/50"}`}>{on && <Check size={14} aria-hidden="true" />}{t}</motion.button>;
            })}
          </div>
          <div className="flex gap-2">
            <input className="input" placeholder="Add your own topic, e.g. Spring Boot" value={custom} maxLength={40} onChange={(e) => setCustom(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustom())} />
            <button type="button" className="btn-ghost" onClick={addCustom}>Add</button>
          </div>
        </div>

        <div className="mb-5">
          <label className="label" htmlFor="ctx">Job description or your CV <span className="font-normal text-muted">(optional, makes questions specific)</span></label>
          <textarea id="ctx" className="input min-h-[110px] resize-y" maxLength={4000} placeholder="Paste the job description or key points from your CV…" value={P.context} onChange={(e) => patch({ context: e.target.value })} />
        </div>

        <button className="btn-primary w-full text-[1.05rem]" disabled={P.busy || !P.role.trim()} onClick={start}>
          {P.busy ? "Preparing your questions…" : "Start interview"}
        </button>
        {P.error && <p role="alert" className="mt-3 whitespace-pre-wrap break-words font-semibold text-bad">{P.error}</p>}
      </motion.div>
    </motion.div>
  );
}

/* -------------------------------- interview ------------------------------- */
function Interview() {
  const { P, send, endEarly } = usePractice();
  const [text, setText] = useState("");
  const [, tick] = useState(0);
  const startedAt = useRef(Date.now());
  const endRef = useRef(null);
  const speech = useSpeech((t) => setText((v) => (v ? v + " " : "") + t));

  useEffect(() => { startedAt.current = Date.now(); }, [P.question]);
  useEffect(() => { const id = setInterval(() => tick((n) => n + 1), 1000); return () => clearInterval(id); }, []);
  useEffect(() => { endRef.current?.scrollIntoView?.({ behavior: "smooth", block: "end" }); }, [P.turns.length, P.pending, P.busy, P.error]);

  const secs = Math.floor((Date.now() - startedAt.current) / 1000);
  const words = text.split(/\s+/).filter(Boolean).length;

  async function submit() {
    const t = text.trim();
    if (!t || P.busy) return;
    setText("");
    const ok = await send(t, Math.round((Date.now() - startedAt.current) / 1000));
    if (!ok) setText(t);
  }
  function quit() {
    if (P.turns.length ? confirm("End now and get your results for the answers so far?") : confirm("Leave this interview? Nothing has been saved yet.")) endEarly();
  }
  const done = P.turns.length;

  return (
    <motion.div className="mx-auto max-w-[760px]" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}>
      <div className="mb-3.5 flex items-center gap-3">
        <span className="text-xs font-bold uppercase tracking-wider text-muted">Progress</span>
        <div role="progressbar" aria-label="Interview progress" aria-valuemin={0} aria-valuemax={P.total} aria-valuenow={done} className="h-2 flex-1 overflow-hidden rounded-full bg-line"><div className="practice-progress-fill h-full rounded-full transition-[width] duration-500" style={{ width: `${(done / P.total) * 100}%` }} /></div>
        <span className="whitespace-nowrap text-sm text-muted">Question {Math.min(done + 1, P.total)} of {P.total}</span>
      </div>

      <div className="flex flex-col gap-3 pb-4" aria-live="polite">
        {P.turns.map((t, i) => (
          <motion.div key={i} layout className="flex flex-col gap-3" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, ease: "easeOut" }}>
            <motion.div className="chat-question max-w-[94%] self-start rounded-[4px_16px_16px_16px] px-4 py-3.5 text-[1.05rem] font-semibold" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.24 }}>{t.q}</motion.div>
            <motion.div className="chat-answer max-w-[90%] self-end whitespace-pre-wrap break-words rounded-[16px_4px_16px_16px] border-[1.5px] border-line bg-card px-3.5 py-3" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.24, delay: 0.04 }}>{t.a}</motion.div>
            <motion.div className="card feedback-card !rounded-[4px_14px_14px_4px] !p-3.5 border-l-[5px]" style={{ borderLeftColor: scoreColor(t.score) }} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24, delay: 0.08 }}>
              <span className="text-2xl font-extrabold tracking-tight" style={{ color: scoreColor(t.score) }}>{t.score}/10</span> <small className="text-muted">{scoreWord(t.score)}</small>
              <p className="mt-1.5 whitespace-pre-wrap">{t.feedback}</p>
              {t.skills && (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {Object.entries(SKILL_LABELS).map(([k, l]) => <span key={k} className="rounded-full bg-soft px-2.5 py-0.5 text-xs font-semibold">{l} {t.skills[k]}</span>)}
                </div>
              )}
            </motion.div>
          </motion.div>
        ))}
        {done < P.total && P.question && <motion.div key={`question-${done}`} className="chat-question max-w-[94%] self-start rounded-[4px_16px_16px_16px] px-4 py-3.5 text-[1.05rem] font-semibold" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.26 }}>{P.question}</motion.div>}
        <AnimatePresence initial={false}>{P.pending && <motion.div key="pending-answer" className="chat-answer max-w-[90%] self-end whitespace-pre-wrap break-words rounded-[16px_4px_16px_16px] border-[1.5px] border-line bg-card px-3.5 py-3" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.2 }}>{P.pending}</motion.div>}</AnimatePresence>
        {P.busy && (
          <motion.div className="flex items-center gap-1 italic text-muted" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {[0, 0.18, 0.36].map((d) => <i key={d} className="h-[7px] w-[7px] animate-blink rounded-full bg-muted" style={{ animationDelay: `${d}s` }} />)}
            <span className="ml-1.5">Coach is reviewing your answer</span>
          </motion.div>
        )}
        <AnimatePresence initial={false}>{P.error && <motion.p role="alert" className="whitespace-pre-wrap break-words font-semibold text-bad" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}>{P.error}</motion.p>}</AnimatePresence>
        <div ref={endRef} />
      </div>

      <motion.div layout className="interview-composer sticky bottom-16 z-10 py-3 lg:bottom-0">
        <textarea aria-label="Your answer" className="input mb-2 min-h-[96px] resize-none" placeholder="Type your answer, or use the microphone…" value={text} disabled={P.busy}
          onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.ctrlKey || e.metaKey) && submit()} />
        <div className="flex gap-2.5">
          <motion.button whileTap={{ scale: 0.98 }} className="btn-primary flex-[3]" disabled={P.busy || !text.trim()} onClick={submit}><Send size={17} aria-hidden="true" /> Send answer</motion.button>
          {speech.supported && (
            <motion.button whileTap={{ scale: 0.94 }} className={`btn-ghost ${speech.on ? "animate-rec !border-bad !text-bad" : ""}`} onClick={speech.toggle} aria-pressed={speech.on} aria-label={speech.on ? "Stop dictation" : "Start dictation"} title={speech.on ? "Stop dictation" : "Dictate your answer"}>
              {speech.on ? <MicOff size={18} aria-hidden="true" /> : <Mic size={18} aria-hidden="true" />}
            </motion.button>
          )}
          <button className="btn-ghost" onClick={quit}>End</button>
        </div>
        <p className="mt-1.5 text-xs text-muted">{words} words · {Math.floor(secs / 60)}:{String(secs % 60).padStart(2, "0")} · Ctrl+Enter sends · try the STAR method</p>
      </motion.div>
    </motion.div>
  );
}

/* --------------------------------- result --------------------------------- */
function Result() {
  const { P, reset } = usePractice();
  const { user, setOpenId } = useApp();
  const nav = useNavigate();
  const s = P.result;
  const d = s.prev == null ? null : s.overall - s.prev;
  const sk = s.turns.some((t) => t.skills)
    ? Object.entries(SKILL_LABELS).map(([k, label]) => ({ key: k, label, value: s.turns.filter((t) => t.skills).reduce((a, t) => a + (+t.skills[k] || 0), 0) / s.turns.filter((t) => t.skills).length }))
    : null;
  const List = ({ title, items, color }) => (
    <section className="card animate-view border-l-[5px]" style={{ borderLeftColor: color }}>
      <h2 className="mb-2">{title}</h2>
      <ul className="grid list-disc gap-1.5 pl-5">{(items.length ? items : ["See the per-question feedback for details."]).map((x, i) => <li key={i}>{x}</li>)}</ul>
    </section>
  );
  return (
    <motion.div className="mx-auto grid max-w-[720px] gap-3" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}>
      <motion.section className="card gradient-panel !p-5 sm:!p-7" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}>
        <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[.14em] text-muted"><CheckCircle2 size={16} className="text-good" aria-hidden="true" /> Interview complete <span className="text-line">/</span> {s.role}</div>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="text-6xl font-extrabold leading-none tracking-tight sm:text-7xl" style={{ color: scoreColor(s.overall) }}>
            <CountUp to={s.overall} dec={1} /><small className="ml-1 text-[.35em] text-muted">/10</small>
          </div>
          <span className="inline-flex items-center gap-2 rounded-xl border border-line bg-card/75 px-3 py-2 text-sm font-bold">
            <Target size={16} className="text-cobalt" aria-hidden="true" />
            {s.overall >= user.goal ? `Goal reached · ${user.goal}/10` : `${(user.goal - s.overall).toFixed(1)} to your ${user.goal}/10 goal`}
          </span>
        </div>
        <p className="mt-3 text-muted">{scoreWord(s.overall)} performance{s.overall >= user.goal ? ", you hit your target." : "."}</p>
        {d !== null && <p className="mt-2 text-sm font-bold" style={{ color: d >= 0 ? "rgb(var(--good))" : "rgb(var(--bad))" }}>{d >= 0 ? "▲" : "▼"} {fmt(Math.abs(d))} {d >= 0 ? "above" : "below"} your average</p>}
      </motion.section>
      <section className="card animate-view"><h2 className="mb-3">Score per question</h2>
        <div className="grid gap-3">{s.turns.map((t, i) => <Bar key={i} labelWidth="w-24" label={`Question ${i + 1}`} pct={t.score * 10} color={scoreColor(t.score)} display={t.score} />)}</div>
      </section>
      {sk && <section className="card animate-view"><h2 className="mb-1">Skills in this interview</h2><Radar data={sk} /></section>}
      <List title="What worked" items={s.strengths} color="rgb(var(--good))" />
      <List title="What to improve" items={s.improvements} color="rgb(var(--marker))" />
      {s.next_steps && <section className="card animate-view"><h2 className="mb-2">Practice plan</h2><p>{s.next_steps}</p></section>}
      <div className="flex flex-wrap gap-2.5">
        <button className="btn-primary flex-1" onClick={() => reset()}><RotateCcw size={17} aria-hidden="true" /> Practise again</button>
        {s.id !== "unsaved" && <button className="btn-ghost flex-1" onClick={() => setOpenId(s.id)}><ClipboardList size={17} aria-hidden="true" /> Review answers</button>}
        <button className="btn-ghost flex-1" onClick={() => nav("/")}>Dashboard <ArrowUpRight size={17} aria-hidden="true" /></button>
      </div>
    </motion.div>
  );
}

export default function Practice() {
  const { P } = usePractice();
  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence mode="wait" initial={false}>
        {P.stage === "interview" && <Interview key="interview" />}
        {P.stage === "analysing" && (
          <motion.div key="analysing" className="card mx-auto max-w-[680px] py-10 text-center" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
            <motion.span className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-xl bg-soft text-cobalt" animate={{ rotate: 360 }} transition={{ duration: 8, ease: "linear", repeat: Infinity }}><Sparkles size={20} aria-hidden="true" /></motion.span>
            <h2 className="mb-1.5">Analysing your interview…</h2>
            <p className="text-muted">Building your score report.</p>
            <div className="mt-4 flex justify-center gap-1">{[0, 0.18, 0.36].map((d) => <i key={d} className="h-[7px] w-[7px] animate-blink rounded-full bg-muted" style={{ animationDelay: `${d}s` }} />)}</div>
          </motion.div>
        )}
        {P.stage === "result" && <Result key="result" />}
        {P.stage === "setup" && <Setup key="setup" />}
      </AnimatePresence>
    </MotionConfig>
  );
}
