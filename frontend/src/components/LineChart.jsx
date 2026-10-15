import { dayFmt } from "../lib/utils";

export default function LineChart({ sessions, goal, onSelect }) {
  const pts = sessions.slice(-12);
  const W = 640, H = 240, pl = 30, pr = 14, pt = 14, pb = 26;
  const x = (i) => (pts.length === 1 ? pl + (W - pl - pr) / 2 : pl + (i * (W - pl - pr)) / (pts.length - 1));
  const y = (v) => pt + (H - pt - pb) * (1 - v / 10);
  const d = pts.map((s, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(s.overall).toFixed(1)}`).join(" ");
  const gy = y(goal);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full overflow-visible" role="img" aria-label={`Score trend over your last ${pts.length} interviews`}>
      {[0, 2, 4, 6, 8, 10].map((v) => (
        <g key={v}>
          <line x1={pl} x2={W - pr} y1={y(v)} y2={y(v)} stroke="rgb(var(--line))" />
          <text x={pl - 8} y={y(v) + 4} textAnchor="end" fontSize="11" fill="rgb(var(--muted))">{v}</text>
        </g>
      ))}
      <line x1={pl} x2={W - pr} y1={gy} y2={gy} stroke="rgb(var(--good))" strokeWidth="1.5" strokeDasharray="5 5" />
      <text x={W - pr} y={gy - 6} textAnchor="end" fontSize="11" fontWeight="700" fill="rgb(var(--good))">Goal {goal}</text>
      {pts.length > 1 && <path d={`${d} L${x(pts.length - 1)} ${y(0)} L${x(0)} ${y(0)} Z`} fill="rgb(var(--cobalt))" opacity=".1" />}
      <path d={d} pathLength="1" strokeDasharray="1" className="animate-draw" fill="none" stroke="rgb(var(--cobalt))" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((s, i) => (
        <circle key={s.id} cx={x(i)} cy={y(s.overall)} r="5" fill="rgb(var(--card))" stroke="rgb(var(--cobalt))" strokeWidth="2.5"
          className="animate-pop cursor-pointer" style={{ animationDelay: `${0.7 + i * 0.07}s`, transformBox: "fill-box", transformOrigin: "center" }}
          onClick={() => onSelect?.(s.id)}>
          <title>{`${dayFmt(s.date)}: ${s.overall}/10`}</title>
        </circle>
      ))}
      {pts.map((s, i) => (pts.length <= 6 || i % 2 === 0) && (
        <text key={"l" + s.id} x={x(i)} y={H - 6} textAnchor="middle" fontSize="11" fill="rgb(var(--muted))">{dayFmt(s.date)}</text>
      ))}
    </svg>
  );
}
