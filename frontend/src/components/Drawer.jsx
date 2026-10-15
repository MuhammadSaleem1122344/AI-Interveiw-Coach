import { useEffect, useRef } from "react";
import { useApp } from "../context/AppContext";
import { scoreColor, timeFmt } from "../lib/utils";

export default function Drawer() {
  const { sessions, openId, setOpenId, deleteSession, toast } = useApp();
  const found = sessions.find((s) => s.id === openId);
  const last = useRef(null);
  if (found) last.current = found;
  const s = found || last.current; // keep content while sliding out
  const open = !!found;
  const close = () => setOpenId(null);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <div onClick={close} className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 ${open ? "opacity-100" : "pointer-events-none opacity-0"}`} />
      <aside aria-label="Interview details" aria-hidden={!open}
        className={`drawer-surface fixed z-50 overflow-auto p-5 pb-8 transition-transform duration-[380ms] ease-[cubic-bezier(.2,.7,.2,1)]
          max-lg:inset-x-0 max-lg:bottom-0 max-lg:max-h-[88vh] max-lg:rounded-t-3xl
          lg:bottom-0 lg:right-0 lg:top-0 lg:w-[480px] lg:border-l lg:border-line
          ${open ? "translate-x-0 translate-y-0" : "max-lg:translate-y-full lg:translate-x-full"}`}>
        {s && (
          <>
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-muted">{timeFmt(s.date)} · {s.kind} · {s.level}</p>
                <h1 className="!text-2xl">{s.role}</h1>
                <div className="mt-1.5 text-5xl font-extrabold tracking-tighter" style={{ color: scoreColor(s.overall) }}>
                  {s.overall}<small className="text-lg text-muted">/10</small>
                </div>
              </div>
              <button onClick={close} aria-label="Close" className="h-9 w-9 flex-none rounded-full border border-line bg-card">✕</button>
            </div>
            {s.strengths.length > 0 && (
              <div className="card mb-2.5 border-l-[5px] !border-l-good">
                <h2 className="mb-2">What worked</h2>
                <ul className="grid list-disc gap-1.5 pl-5">{s.strengths.map((x, i) => <li key={i}>{x}</li>)}</ul>
              </div>
            )}
            {s.improvements.length > 0 && (
              <div className="card mb-2.5 border-l-[5px] !border-l-marker">
                <h2 className="mb-2">What to improve</h2>
                <ul className="grid list-disc gap-1.5 pl-5">{s.improvements.map((x, i) => <li key={i}>{x}</li>)}</ul>
              </div>
            )}
            <div className="card">
              <h2 className="mb-2">Questions and feedback</h2>
              {s.turns.map((t, i) => (
                <div key={i} className="border-t border-line py-3 first:border-0">
                  <div className="font-bold">{i + 1}. {t.q}</div>
                  <div className="my-1.5 whitespace-pre-wrap text-muted">{t.a}</div>
                  <span className="chip" style={{ background: scoreColor(t.score) }}>{t.score}/10</span>
                  {t.words != null && <span className="ml-2 text-xs text-muted">{t.words} words{t.secs ? ` · ${Math.floor(t.secs / 60)}m ${t.secs % 60}s` : ""}</span>}
                  <p className="mt-2 whitespace-pre-wrap">{t.feedback}</p>
                </div>
              ))}
            </div>
            <button className="btn-danger mt-4 w-full" onClick={async () => { if (confirm("Delete this interview permanently?")) { try { await deleteSession(s.id); setOpenId(null); toast("Interview deleted"); } catch (e) { toast(e.message); } } }}>
              Delete this interview
            </button>
          </>
        )}
      </aside>
    </>
  );
}
