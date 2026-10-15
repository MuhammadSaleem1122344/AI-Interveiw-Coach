import { activity } from "../lib/analytics";

export default function Heatmap({ sessions }) {
  const days = activity(sessions, 28);
  const cls = (n) => (n === 0 ? "bg-line" : n === 1 ? "bg-cobalt/40" : n === 2 ? "bg-cobalt/70" : "bg-cobalt");
  return (
    <div className="grid grid-cols-7 gap-1.5" role="img" aria-label="Practice activity for the last 4 weeks">
      {days.map((d, i) => (
        <div key={i} title={`${d.date.toLocaleDateString()}: ${d.n} interview${d.n === 1 ? "" : "s"}`}
          className={`aspect-square rounded-md ${cls(d.n)} animate-pop`} style={{ animationDelay: `${i * 12}ms` }} />
      ))}
    </div>
  );
}
