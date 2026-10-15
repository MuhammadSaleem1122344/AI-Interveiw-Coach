import { useMounted } from "../hooks/useCountUp";

export default function Bar({ label, pct, color, display, labelWidth = "w-24" }) {
  const m = useMounted();
  return (
    <div className="flex items-center gap-2.5 text-sm">
      <span className={`${labelWidth} flex-none`}>{label}</span>
      <div className="h-2.5 flex-1 overflow-hidden rounded-md bg-line">
        <div className="h-full rounded-md transition-[width] duration-[900ms] ease-[cubic-bezier(.2,.7,.2,1)]" style={{ width: m ? `${Math.max(0, Math.min(100, pct))}%` : 0, background: color }} />
      </div>
      <b className="w-9 text-right">{display}</b>
    </div>
  );
}
