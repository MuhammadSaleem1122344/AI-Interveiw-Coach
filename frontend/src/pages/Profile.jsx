import { useState } from "react";
import { Download, Flame, LogOut, MessageSquareText, Target, Trash2, UserRound } from "lucide-react";
import Avatar from "../components/Avatar";
import ProfileForm from "../components/ProfileForm";
import { CountUp } from "../hooks/useCountUp";
import { useApp } from "../context/AppContext";
import { usePractice } from "../context/PracticeContext";
import { avg } from "../lib/utils";
import { streak } from "../lib/analytics";

export default function Profile() {
  const { user, sessions, updateProfile, setTheme, theme, clearSessions, deleteAccount, logout, toast } = useApp();
  const { reset } = usePractice();
  const [form, setForm] = useState({ ...user, theme });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const ov = sessions.map((s) => s.overall);

  const onChange = (p) => {
    setForm((f) => ({ ...f, ...p }));
    if (p.theme) setTheme(p.theme);
  };
  async function save() {
    if (!form.name.trim() || !form.role.trim()) return setErr("Name and role are required.");
    setErr(""); setBusy(true);
    try {
      const u = await updateProfile({ name: form.name.trim(), role: form.role.trim(), level: form.level, goal: form.goal, weekly: form.weekly, color: form.color });
      reset(u);
      toast("Profile saved");
    } catch (e) { setErr(e.message); }
    setBusy(false);
  }
  const exportData = () => {
    const blob = new Blob([JSON.stringify({ profile: { ...user }, sessions }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "interview-coach-data.json";
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const guard = async (msg, fn, done) => {
    if (!confirm(msg)) return;
    try { await fn(); if (done) toast(done); } catch (e) { toast(e.message); }
  };

  return (
    <div>
      <header className="mb-5 flex items-center gap-4">
        <Avatar profile={user} size="lg" />
        <div className="min-w-0">
          <p className="mb-1 text-xs font-bold uppercase tracking-[.14em] text-muted">Account and preferences</p>
          <h1 className="truncate">{user.name}</h1>
          <p className="sub !mt-0.5 truncate">{user.email} · member since {new Date(user.created).toLocaleDateString(undefined, { month: "long", year: "numeric" })}</p>
        </div>
      </header>

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[["Interviews", sessions.length, 0, MessageSquareText], ["Answers given", sessions.flatMap((s) => s.turns).length, 0, UserRound], ["Average score", ov.length ? avg(ov) : NaN, 1, Target], ["Day streak", streak(sessions), 0, Flame]].map(([label, value, decimals, Icon], i) => (
          <div key={label} className="card animate-view !p-4 sm:!p-5" style={{ animationDelay: `${i * 70}ms` }}>
            <span className="mb-4 grid h-9 w-9 place-items-center rounded-lg bg-soft text-cobalt"><Icon size={18} aria-hidden="true" /></span>
            <div className="text-[2rem] font-extrabold leading-tight tracking-tight"><CountUp to={value} dec={decimals} /></div>
            <div className="mt-0.5 text-sm font-semibold">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <section className="card">
          <div className="mb-4 flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-soft text-cobalt"><UserRound size={18} aria-hidden="true" /></span>
            <div><h2>Edit profile</h2><p className="text-sm text-muted">Personalize your coaching goals.</p></div>
          </div>
          <ProfileForm value={form} onChange={onChange} showTheme />
          <button className="btn-primary w-full text-[1.05rem]" disabled={busy} onClick={save}>{busy ? "Saving…" : "Save changes"}</button>
          {err && <p role="alert" className="mt-3 font-semibold text-bad">{err}</p>}
        </section>

        <section className="card">
          <div className="mb-4 flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-soft text-cobalt"><Target size={18} aria-hidden="true" /></span>
            <div><h2>Your account</h2><p className="text-sm text-muted">Manage your data and access.</p></div>
          </div>
          <p className="sub mb-4 !mt-0">Your interviews are private to this account.</p>
          <div className="grid gap-2.5">
            <button className="btn-ghost justify-start" onClick={exportData}><Download size={18} aria-hidden="true" /> Download my data (JSON)</button>
            <button className="btn-ghost justify-start" onClick={logout}><LogOut size={18} aria-hidden="true" /> Sign out</button>
            <div className="my-1 border-t border-line" />
            <button className="btn-danger justify-start" onClick={() => guard("Delete all your saved interviews?", clearSessions, "Interviews deleted")}><Trash2 size={18} aria-hidden="true" /> Delete all interviews</button>
            <button className="btn-danger justify-start" onClick={() => guard("Permanently delete your account and all data?", deleteAccount)}><Trash2 size={18} aria-hidden="true" /> Delete my account</button>
          </div>
        </section>
      </div>
    </div>
  );
}
