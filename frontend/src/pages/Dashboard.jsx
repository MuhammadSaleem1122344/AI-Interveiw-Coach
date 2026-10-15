import { useNavigate } from "react-router-dom";
import { Activity, ArrowUpRight, Flame, Sparkles, Target, Trophy } from "lucide-react";
import Badges from "../components/Badges";
import Bar from "../components/Bar";
import Heatmap from "../components/Heatmap";
import LineChart from "../components/LineChart";
import Radar from "../components/Radar";
import Ring from "../components/Ring";
import { CountUp } from "../hooks/useCountUp";
import { useApp } from "../context/AppContext";
import { avg, fmt, greeting, scoreColor, timeFmt } from "../lib/utils";
import { distribution, insightText, kindStats, longestStreak, recurringWeakAreas, skillAverages, streak, weekCount } from "../lib/analytics";

const Stat = ({ to, dec, label, detail, Icon, i }) => (
  <div className="card dashboard-stat animate-view !p-4 sm:!p-5" style={{ animationDelay: `${i * 70}ms` }}>
    <div className="mb-5 flex items-start justify-between gap-2">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-soft text-cobalt"><Icon size={19} strokeWidth={2.2} aria-hidden="true" /></span>
      <span className="mt-1 text-[11px] font-bold uppercase tracking-wider text-muted">Overview</span>
    </div>
    <div className="text-[2rem] font-extrabold leading-tight tracking-tight"><CountUp to={to} dec={dec} /></div>
    <div className="mt-0.5 text-sm font-semibold">{label}</div>
    <div className="mt-1 text-xs text-muted">{detail}</div>
  </div>
);
const Reveal = ({ i = 0, className = "", children }) => (
  <section className={`card animate-view ${className}`} style={{ animationDelay: `${i * 70}ms` }}>{children}</section>
);

export default function Dashboard() {
  const { user, sessions, setOpenId } = useApp();
  const nav = useNavigate();
  const ov = sessions.map((s) => s.overall);
  const has = sessions.length > 0;
  const recent = avg(ov.slice(-5));
  const week = weekCount(sessions);
  const weekly = user.weekly || 3;
  const dist = distribution(sessions);
  const skills = skillAverages(sessions);
  const weak = recurringWeakAreas(sessions);
  const last = sessions[sessions.length - 1];

  return (
    <div className="dashboard-page">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[.14em] text-muted"><span className="h-2 w-2 rounded-full bg-good" /> Interview coach <span className="text-line">/</span> Dashboard</div>
          <h1>{greeting()}, <span className="mark">{user.name.split(" ")[0]}</span></h1>
          <p className="sub">Your progress toward becoming a {user.role} · {user.level}</p>
        </div>
        <button className="btn-primary gap-2" onClick={() => nav("/practice")}>Start interview <ArrowUpRight size={17} aria-hidden="true" /></button>
      </header>

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat i={0} Icon={Activity} to={sessions.length} label="Interviews done" detail="Practice sessions" />
        <Stat i={1} Icon={Target} to={has ? avg(ov) : NaN} dec={1} label="Average score" detail="Across all interviews" />
        <Stat i={2} Icon={Trophy} to={has ? Math.max(...ov) : NaN} dec={1} label="Best score" detail="Your personal best" />
        <Stat i={3} Icon={Flame} to={streak(sessions)} label="Day streak" detail="Keep the momentum" />
      </div>

      {!has ? (
        <div className="card animate-pop py-10 text-center">
          <h2 className="mb-1.5">No interviews yet</h2>
          <p className="mx-auto max-w-md text-muted">Your score trend, skill radar and weak spots appear here after your first practice interview.</p>
          <button className="btn-primary mt-4" onClick={() => nav("/practice")}>Start your first interview</button>
        </div>
      ) : (
        <>
          <div className="card signature-panel mb-4 flex animate-pop items-start gap-3.5">
            <span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-card text-cobalt shadow-sm"><Sparkles size={19} aria-hidden="true" /></span>
            <div><div className="mb-1 text-xs font-bold uppercase tracking-wider text-cobalt">Personal insight</div><h2 className="mb-1">Your analysis</h2><p className="text-muted">{insightText(sessions, user.goal)}</p></div>
          </div>

          <div className="mb-3 grid gap-3 lg:grid-cols-[1.7fr_1fr]">
            <Reveal i={0}><h2>Score trend</h2><LineChart sessions={sessions} goal={user.goal} onSelect={setOpenId} /></Reveal>
            <Reveal i={1}>
              <h2>Goal progress</h2>
              <Ring value={recent} goal={user.goal} />
              <p className="mt-2 text-center text-sm text-muted">Average of your last {Math.min(5, sessions.length)} interview{sessions.length > 1 ? "s" : ""}</p>
            </Reveal>
          </div>

          <div className="mb-3 grid gap-3 md:grid-cols-2">
            <Reveal i={0}>
              <h2>Skill radar</h2>
              {skills ? <Radar data={skills} /> : <p className="text-muted">Skill scores appear after your next interview.</p>}
            </Reveal>
            <Reveal i={1}>
              <h2>This week</h2>
              <div className="mb-1 flex items-end justify-between"><b className="text-3xl tracking-tight"><CountUp to={week} /> / {weekly}</b><span className="text-sm text-muted">interviews</span></div>
              <Bar label="" labelWidth="w-0" pct={(week / weekly) * 100} color="rgb(var(--good))" display={week >= weekly ? "✓" : ""} />
              <p className="mb-4 mt-2 text-sm text-muted">{week >= weekly ? "Weekly goal reached. Great consistency." : `${weekly - week} more to reach your weekly goal.`}</p>
              <h2 className="!mb-2 !text-base">Last 4 weeks</h2>
              <Heatmap sessions={sessions} />
              <p className="mt-2 text-sm text-muted">Longest streak: {longestStreak(sessions)} day{longestStreak(sessions) === 1 ? "" : "s"}</p>
            </Reveal>
          </div>

          <div className="mb-3 grid gap-3 md:grid-cols-2">
            <Reveal i={0}>
              <h2>How your answers score</h2>
              <div className="grid gap-3">
                {dist.rows.map((r) => <Bar key={r.label} labelWidth="w-32" label={r.label} pct={dist.total ? (r.n / dist.total) * 100 : 0} color={r.color} display={r.n} />)}
              </div>
            </Reveal>
            <Reveal i={1}>
              <h2>Average by interview type</h2>
              <div className="grid gap-3">
                {kindStats(sessions).map((k) => <Bar key={k.kind} label={k.kind} pct={k.n ? k.avg * 10 : 0} color={scoreColor(k.avg)} display={k.n ? fmt(k.avg) : "–"} />)}
              </div>
            </Reveal>
          </div>

          <div className="mb-3 grid gap-3 md:grid-cols-2">
            <Reveal i={0}>
              <h2>Achievements</h2>
              <Badges sessions={sessions} />
            </Reveal>
            <Reveal i={1}>
              <h2>Focus for next time</h2>
              <p>{last.next_steps || "Review the feedback from your last interview and practise the weakest answers again."}</p>
              {weak.length > 0 && (
                <ul className="mt-3 grid list-disc gap-1.5 pl-5 text-muted">{weak.map((w, i) => <li key={i}>{w}</li>)}</ul>
              )}
              <button className="btn-primary mt-4" onClick={() => nav("/practice")}>Practise these areas</button>
            </Reveal>
          </div>

          <Reveal>
            <h2>Recent interviews</h2>
            <div className="grid gap-2">
              {sessions.slice(-4).reverse().map((s) => (
                <button key={s.id} onClick={() => setOpenId(s.id)} className="flex w-full items-center gap-3 rounded-xl border border-line bg-card px-3.5 py-3 text-left transition hover:translate-x-1 hover:border-cobalt">
                  <span className="chip" style={{ background: scoreColor(s.overall) }}>{s.overall}</span>
                  <span className="min-w-0 flex-1"><b className="block truncate">{s.role}</b><small className="text-muted">{s.kind} · {s.level} · {timeFmt(s.date)}</small></span>
                </button>
              ))}
            </div>
            <button className="btn-ghost mt-3 w-full" onClick={() => nav("/history")}>View all history</button>
          </Reveal>
        </>
      )}
    </div>
  );
}
