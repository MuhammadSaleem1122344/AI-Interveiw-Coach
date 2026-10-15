const c = (n) => `rgb(var(--${n}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        paper: c("paper"), ink: c("ink"), muted: c("muted"), line: c("line"),
        card: c("card"), soft: c("soft"), cobalt: c("cobalt"), marker: c("marker"),
        good: c("good"), warn: c("warn"), bad: c("bad"),
      },
      fontFamily: { sans: ['"Bricolage Grotesque"', "system-ui", "-apple-system", '"Segoe UI"', "sans-serif"] },
      keyframes: {
        viewIn: { from: { opacity: 0, transform: "translateY(10px)" }, to: { opacity: 1, transform: "none" } },
        pop: { from: { opacity: 0, transform: "scale(.94) translateY(6px)" }, to: { opacity: 1, transform: "none" } },
        blink: { "0%,80%,100%": { opacity: 0.25, transform: "none" }, "40%": { opacity: 1, transform: "translateY(-3px)" } },
        draw: { from: { strokeDashoffset: 1 }, to: { strokeDashoffset: 0 } },
        pulseRing: { "0%": { boxShadow: "0 0 0 0 rgb(var(--bad) / .5)" }, "100%": { boxShadow: "0 0 0 12px rgb(var(--bad) / 0)" } },
      },
      animation: {
        view: "viewIn .4s cubic-bezier(.2,.7,.2,1) both",
        pop: "pop .35s cubic-bezier(.2,.9,.3,1.3) both",
        blink: "blink 1.1s infinite",
        draw: "draw 1.1s cubic-bezier(.2,.7,.2,1) .15s both",
        rec: "pulseRing 1.2s infinite",
      },
    },
  },
  plugins: [],
};
