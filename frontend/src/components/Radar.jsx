import { useMounted } from "../hooks/useCountUp";

export default function Radar({ data }) {
  const m = useMounted();
  const S = 220, c = S / 2, R = 78, n = data.length;
  const pt = (i, v) => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    return [c + Math.cos(a) * R * (v / 10), c + Math.sin(a) * R * (v / 10)];
  };
  const poly = (f) => data.map((d, i) => pt(i, f(d)).join(",")).join(" ");
  return (
    <svg viewBox={`0 0 ${S} ${S}`} className="mx-auto block h-auto w-full max-w-[260px] overflow-visible" role="img"
      aria-label={"Skill averages: " + data.map((d) => `${d.label} ${d.value.toFixed(1)}`).join(", ")}>
      {[2, 4, 6, 8, 10].map((r) => (
        <polygon key={r} points={poly(() => r)} fill="none" stroke="rgb(var(--line))" />
      ))}
      {data.map((d, i) => {
        const [x, y] = pt(i, 10), [lx, ly] = pt(i, 12.6);
        return (
          <g key={d.key}>
            <line x1={c} y1={c} x2={x} y2={y} stroke="rgb(var(--line))" />
            <text x={lx} y={ly + 4} textAnchor={lx < c - 4 ? "end" : lx > c + 4 ? "start" : "middle"} fontSize="10.5" fill="rgb(var(--muted))">{d.label}</text>
          </g>
        );
      })}
      <polygon points={poly((d) => d.value)} fill="rgb(var(--cobalt))" fillOpacity=".22" stroke="rgb(var(--cobalt))" strokeWidth="2.5" strokeLinejoin="round"
        style={{ transformOrigin: `${c}px ${c}px`, transform: m ? "scale(1)" : "scale(0)", transition: "transform .9s cubic-bezier(.2,.7,.2,1)" }} />
      {data.map((d, i) => {
        const [x, y] = pt(i, d.value);
        return <circle key={d.key} cx={x} cy={y} r="3.5" fill="rgb(var(--cobalt))" style={{ opacity: m ? 1 : 0, transition: "opacity .6s .6s" }}><title>{`${d.label}: ${d.value.toFixed(1)}/10`}</title></circle>;
      })}
    </svg>
  );
}
