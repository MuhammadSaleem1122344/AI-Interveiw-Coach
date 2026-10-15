import Seg from "./Seg";
import { COLORS } from "../lib/utils";

const ROLES = ["Python Backend Developer", "React Frontend Developer", "Java Developer", "Data Analyst", "Machine Learning Engineer", "Product Manager", "DevOps Engineer"];

export default function ProfileForm({ value, onChange, showTheme }) {
  return (
    <>
      <div className="mb-4">
        <label className="label" htmlFor="pf-name">Your name</label>
        <input id="pf-name" className="input" maxLength={40} placeholder="e.g. Muhammad Saleem" value={value.name} onChange={(e) => onChange({ name: e.target.value })} />
      </div>
      <div className="mb-4">
        <label className="label" htmlFor="pf-role">Role you are preparing for</label>
        <input id="pf-role" className="input" maxLength={60} list="roles" placeholder="e.g. Python backend developer" value={value.role} onChange={(e) => onChange({ role: e.target.value })} />
        <datalist id="roles">{ROLES.map((r) => <option key={r}>{r}</option>)}</datalist>
      </div>
      <div className="mb-4">
        <span className="label">Experience level</span>
        <Seg label="Level" options={["Junior", "Mid", "Senior"]} value={value.level} onChange={(level) => onChange({ level })} />
      </div>
      <div className="mb-4">
        <label className="label" htmlFor="pf-goal">Target score: <b>{value.goal}</b>/10</label>
        <input id="pf-goal" type="range" min="5" max="10" step="0.5" value={value.goal} onChange={(e) => onChange({ goal: +e.target.value })} className="w-full accent-cobalt" />
      </div>
      <div className="mb-4">
        <label className="label" htmlFor="pf-weekly">Weekly goal: <b>{value.weekly ?? 3}</b> interview{(value.weekly ?? 3) === 1 ? "" : "s"} per week</label>
        <input id="pf-weekly" type="range" min="1" max="7" step="1" value={value.weekly ?? 3} onChange={(e) => onChange({ weekly: +e.target.value })} className="w-full accent-cobalt" />
      </div>
      <div className="mb-4">
        <span className="label">Avatar color</span>
        <div className="flex flex-wrap gap-2.5">
          {COLORS.map((c) => (
            <button key={c} type="button" aria-label={`Color ${c}`} aria-pressed={c === value.color} onClick={() => onChange({ color: c })}
              className={`h-9 w-9 rounded-full border-[3px] border-card transition ${c === value.color ? "scale-110 ring-2 ring-ink" : ""}`} style={{ background: c }} />
          ))}
        </div>
      </div>
      {showTheme && (
        <div className="mb-4">
          <span className="label">Theme</span>
          <Seg label="Theme" options={["auto", "light", "dark"]} value={value.theme || "auto"} onChange={(theme) => onChange({ theme })} />
        </div>
      )}
    </>
  );
}
