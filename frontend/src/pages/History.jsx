import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, Search, SlidersHorizontal, X } from "lucide-react";
import Seg from "../components/Seg";
import { useApp } from "../context/AppContext";
import { timeFmt, scoreColor } from "../lib/utils";

export default function History() {
  const { sessions, setOpenId } = useApp();
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const [kind, setKind] = useState("All");
  const [sort, setSort] = useState("Newest");

  const rows = useMemo(() => {
    let r = sessions.filter((s) => (kind === "All" || s.kind === kind) && s.role.toLowerCase().includes(q.trim().toLowerCase()));
    r = [...r].sort((a, b) => (sort === "Highest score" ? b.overall - a.overall : new Date(b.date) - new Date(a.date)));
    return r;
  }, [sessions, q, kind, sort]);

  return (
    <div>
      <header className="mb-5">
        <p className="mb-2 text-xs font-bold uppercase tracking-[.14em] text-muted">Your practice archive</p>
        <h1>Interview <span className="mark">history</span></h1>
        <p className="sub">{sessions.length} saved interview{sessions.length === 1 ? "" : "s"}. Tap one to review every question, answer and piece of feedback.</p>
      </header>

      {sessions.length === 0 ? (
        <div className="card animate-pop py-10 text-center">
          <h2 className="mb-1.5">Nothing here yet</h2>
          <p className="text-muted">Finished interviews are saved to your account.</p>
          <button className="btn-primary mt-4" onClick={() => nav("/practice")}>Start an interview</button>
        </div>
      ) : (
        <>
          <div className="card mb-4 !p-4 sm:!p-5">
            <div className="relative mb-4">
              <Search size={18} aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input className="input pl-11 pr-11" placeholder="Search by role…" aria-label="Search interviews" value={q} onChange={(e) => setQ(e.target.value)} />
              {q && <button type="button" aria-label="Clear search" onClick={() => setQ("")} className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-muted transition hover:bg-soft hover:text-ink"><X size={17} /></button>}
            </div>
            <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted"><SlidersHorizontal size={15} aria-hidden="true" /> Filters and sorting</div>
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <Seg label="Type filter" options={["All", "Behavioral", "Technical", "Mixed"]} value={kind} onChange={setKind} />
              <Seg label="Sort" options={["Newest", "Highest score"]} value={sort} onChange={setSort} />
            </div>
          </div>
          <div className="mb-2 flex items-center justify-between text-sm text-muted"><span>{rows.length} result{rows.length === 1 ? "" : "s"}</span>{(q || kind !== "All" || sort !== "Newest") && <button className="font-semibold text-cobalt hover:underline" onClick={() => { setQ(""); setKind("All"); setSort("Newest"); }}>Reset filters</button>}</div>
          {rows.length === 0 && <div className="card py-8 text-center"><p className="font-semibold">No interviews match these filters.</p><p className="mt-1 text-sm text-muted">Try another search term or reset your filters.</p></div>}
          <div className="grid gap-2">
            {rows.map((s, i) => (
              <button key={s.id} onClick={() => setOpenId(s.id)} style={{ animationDelay: `${Math.min(i, 10) * 40}ms` }}
                className="history-row animate-view flex w-full items-center gap-3 rounded-xl border border-line bg-card px-3.5 py-3.5 text-left transition">
                <span className="chip" style={{ background: scoreColor(s.overall) }}>{s.overall}</span>
                <span className="min-w-0 flex-1"><b className="block truncate">{s.role}</b><small className="text-muted">{s.kind} · {s.level} · {s.turns.length} questions · {timeFmt(s.date)}</small></span>
                <ArrowUpRight size={18} className="flex-none text-muted" aria-hidden="true" />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
