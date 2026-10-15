import { useEffect, useState } from "react";

const reduced = () => typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

export function useCountUp(to, ms = 800) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!Number.isFinite(to)) return;
    if (reduced()) { setV(to); return; }
    let raf;
    const t0 = performance.now();
    const tick = (t) => {
      const p = Math.min((t - t0) / ms, 1);
      setV(to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, ms]);
  return v;
}

export function CountUp({ to, dec = 0, suffix = "" }) {
  const v = useCountUp(to);
  return <>{Number.isFinite(to) ? v.toFixed(dec) + suffix : "–"}</>;
}

/** false on first paint, true one frame later: lets CSS transitions run on mount. */
export function useMounted() {
  const [m, setM] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setM(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return m;
}
