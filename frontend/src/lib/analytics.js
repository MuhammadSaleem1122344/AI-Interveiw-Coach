import { avg, fmt } from "./utils";

export const KINDS = ["Behavioral", "Technical", "Mixed"];

export function streak(sessions) {
  const days = new Set(sessions.map((s) => new Date(s.date).toDateString()));
  let n = 0;
  const d = new Date();
  if (!days.has(d.toDateString())) d.setDate(d.getDate() - 1);
  while (days.has(d.toDateString())) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

export function kindStats(sessions) {
  return KINDS.map((kind) => {
    const L = sessions.filter((s) => s.kind === kind);
    return { kind, n: L.length, avg: avg(L.map((s) => s.overall)) };
  });
}

export const BUCKETS = [
  { label: "Strong (8-10)", lo: 8, hi: 10, color: "rgb(var(--good))" },
  { label: "Solid (6-7)", lo: 6, hi: 7.99, color: "rgb(var(--cobalt))" },
  { label: "Developing (4-5)", lo: 4, hi: 5.99, color: "rgb(var(--warn))" },
  { label: "Needs work (0-3)", lo: 0, hi: 3.99, color: "rgb(var(--bad))" },
];

export function distribution(sessions) {
  const turns = sessions.flatMap((s) => s.turns || []);
  return {
    total: turns.length,
    rows: BUCKETS.map((b) => ({ ...b, n: turns.filter((t) => t.score >= b.lo && t.score <= b.hi).length })),
  };
}

export function activity(sessions, days = 28) {
  const map = {};
  sessions.forEach((s) => {
    const k = new Date(s.date).toDateString();
    map[k] = (map[k] || 0) + 1;
  });
  const out = [];
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  for (let i = days - 1; i >= 0; i--) {
    const x = new Date(base);
    x.setDate(base.getDate() - i);
    out.push({ date: x, n: map[x.toDateString()] || 0 });
  }
  return out;
}

export function insightText(sessions, goal) {
  if (!sessions.length) return "Complete your first interview to unlock score analysis and trends.";
  const ov = sessions.map((s) => s.overall);
  const parts = [];
  if (ov.length >= 2) {
    const dlt = ov[ov.length - 1] - avg(ov.slice(0, -1));
    parts.push(
      Math.abs(dlt) < 0.3
        ? "Your latest score is in line with your average."
        : dlt > 0
        ? `Your latest score is ${fmt(dlt)} points above your previous average. Keep it up.`
        : `Your latest score is ${fmt(-dlt)} points below your previous average, so review the feedback and retry.`
    );
  }
  const kinds = kindStats(sessions).filter((k) => k.n);
  if (kinds.length > 1) {
    const w = kinds.reduce((a, b) => (a.avg < b.avg ? a : b));
    parts.push(`${w.kind} interviews are your weakest area (${fmt(w.avg)}/10 average).`);
  }
  const a = avg(ov);
  parts.push(a >= goal ? "You are at or above your target score." : `You are ${fmt(goal - a)} points from your target of ${goal}.`);
  return parts.join(" ");
}

export function longestStreak(sessions) {
  const days = [...new Set(sessions.map((s) => new Date(s.date).setHours(0, 0, 0, 0)))].sort((a, b) => a - b);
  let best = 0, run = 0, prev = null;
  for (const d of days) {
    run = prev !== null && Math.round((d - prev) / 86400000) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return best;
}

export const SKILL_LABELS = { communication: "Communication", technical_depth: "Technical depth", structure: "Structure", clarity: "Clarity" };

/** Average of each skill across all answers (null if no skill data yet). */
export function skillAverages(sessions) {
  const turns = sessions.flatMap((s) => s.turns || []).filter((t) => t.skills);
  if (!turns.length) return null;
  return Object.keys(SKILL_LABELS).map((k) => ({ key: k, label: SKILL_LABELS[k], value: avg(turns.map((t) => +t.skills[k] || 0)) }));
}

export function weekCount(sessions) {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(now.getDate() - ((now.getDay() + 6) % 7)); // Monday
  return sessions.filter((s) => new Date(s.date) >= start).length;
}

export function recurringWeakAreas(sessions, n = 4) {
  return sessions.slice(-3).flatMap((s) => s.improvements || []).slice(0, n);
}
