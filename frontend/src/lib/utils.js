export const COLORS = ["#2B50FF", "#1F9D75", "#E0457B", "#D98200", "#7A4DFF", "#14213D"];

export const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
export const fmt = (n) => String(Math.round(n * 10) / 10);

export const scoreColor = (v) =>
  v >= 8 ? "rgb(var(--good))" : v >= 6 ? "rgb(var(--cobalt))" : v >= 4 ? "rgb(var(--warn))" : "rgb(var(--bad))";
export const scoreWord = (v) => (v >= 8 ? "Strong" : v >= 6 ? "Solid" : v >= 4 ? "Developing" : "Needs work");

export const initials = (n) =>
  (n || "?").trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";

export const dayFmt = (iso) => new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });
export const timeFmt = (iso) =>
  new Date(iso).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
};

/** Turn any model output (string / list / object) into plain text. */
export const toText = (v) =>
  typeof v === "string"
    ? v
    : Array.isArray(v)
    ? v.map(toText).join("\n")
    : v && typeof v === "object"
    ? Object.entries(v).map(([k, x]) => `${k}: ${toText(x)}`).join("\n")
    : String(v ?? "");

export const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
