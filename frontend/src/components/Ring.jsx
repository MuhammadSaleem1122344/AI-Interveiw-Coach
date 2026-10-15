import { useMounted, CountUp } from "../hooks/useCountUp";

export default function Ring({ value, goal }) {
  const m = useMounted();
  const C = 2 * Math.PI * 52;
  const pct = Math.min(value / goal, 1);
  return (
    <div className="relative mx-auto h-[140px] w-[140px]">
      <svg viewBox="0 0 140 140" className="h-full w-full" role="img" aria-label="Average of your last five interviews versus your goal">
        <circle cx="70" cy="70" r="52" fill="none" stroke="rgb(var(--line))" strokeWidth="12" />
        <circle cx="70" cy="70" r="52" fill="none" stroke="rgb(var(--good))" strokeWidth="12" strokeLinecap="round"
          strokeDasharray={`${m ? pct * C : 0} ${C}`} transform="rotate(-90 70 70)" style={{ transition: "stroke-dasharray 1s cubic-bezier(.2,.7,.2,1)" }} />
      </svg>
      <div className="absolute inset-0 grid place-content-center text-center">
        <b className="text-3xl leading-none tracking-tight"><CountUp to={value} dec={1} /></b>
        <small className="text-muted">of {goal}</small>
      </div>
    </div>
  );
}
