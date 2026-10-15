import { earned } from "../lib/achievements";

export default function Badges({ sessions }) {
  const list = earned(sessions);
  const n = list.filter((b) => b.done).length;
  const progress = list.length ? (n / list.length) * 100 : 0;
  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold">{n} of {list.length} unlocked</p>
        <span className="text-xs font-bold text-muted">{Math.round(progress)}%</span>
      </div>
      <div className="mb-4 h-2 overflow-hidden rounded-full bg-line" role="progressbar" aria-label="Achievement progress" aria-valuemin={0} aria-valuemax={list.length} aria-valuenow={n}>
        <div className="h-full rounded-full bg-gradient-to-r from-cobalt via-good to-marker transition-[width] duration-700 ease-out" style={{ width: `${progress}%` }} />
      </div>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-5" role="list">
        {list.map((b, i) => (
          <div key={b.id} role="listitem" title={`${b.title}: ${b.desc}`}
            className={`badge-tile animate-pop ${b.done ? "badge-tile-earned" : "badge-tile-locked"}`}
            style={{ animationDelay: `${i * 40}ms` }}>
            <span className="badge-icon" aria-hidden="true">{b.icon}</span>
            <span className="mt-2 block text-xs font-bold leading-tight">{b.title}</span>
            <span className="mt-1 block text-[.68rem] leading-tight text-muted">{b.done ? "Unlocked" : "Locked"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
