import { NavLink, Outlet, useLocation } from "react-router-dom";
import { GraduationCap, History as HistoryIcon, LayoutDashboard, LogOut, MessageSquareText, Moon, Sun, UserRound } from "lucide-react";
import Avatar from "./Avatar";
import Drawer from "./Drawer";
import Toast from "./Toast";
import { useApp } from "../context/AppContext";

const LINKS = [
  { to: "/", key: "dashboard", label: "Dashboard", end: true },
  { to: "/practice", key: "practice", label: "Practice" },
  { to: "/history", key: "history", label: "History" },
  { to: "/profile", key: "profile", label: "Profile" },
];

const ICONS = { dashboard: LayoutDashboard, practice: MessageSquareText, history: HistoryIcon, profile: UserRound };
const NavIcon = ({ name }) => {
  const Icon = ICONS[name];
  return <Icon size={20} strokeWidth={1.9} aria-hidden="true" />;
};

export default function Layout() {
  const { user: profile, logout, theme, setTheme } = useApp();
  const { pathname } = useLocation();
  const dark = document.documentElement.classList.contains("dark");
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
      {/* desktop sidebar */}
      <aside className="glass-surface sticky top-0 hidden h-screen flex-col gap-1.5 border-r p-4 pt-6 lg:flex">
        <div className="mb-7 flex items-center gap-2.5 px-1 text-lg font-extrabold tracking-tight">
          <i className="grid h-10 w-10 place-items-center rounded-xl bg-cobalt text-white shadow-lg shadow-cobalt/20"><GraduationCap size={21} aria-hidden="true" /></i>
          Interview Coach
        </div>
        {LINKS.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.end}
            className={({ isActive }) => `group relative flex items-center gap-3 rounded-xl px-3.5 py-3 font-semibold transition duration-200 ${isActive ? "nav-active text-cobalt" : "text-muted hover:translate-x-0.5 hover:bg-soft hover:text-ink"}`}>
            <span className="grid h-[22px] w-[22px] place-items-center"><NavIcon name={l.key} /></span>{l.label}
          </NavLink>
        ))}
        <button onClick={() => setTheme(dark ? "light" : "dark")} aria-label={`Switch to ${dark ? "light" : "dark"} theme`} title={`Switch to ${dark ? "light" : "dark"} theme`} className="mb-2 flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold text-muted transition hover:bg-soft hover:text-ink">
          {dark ? <Sun size={20} aria-hidden="true" /> : <Moon size={20} aria-hidden="true" />}
          {dark ? "Light appearance" : "Dark appearance"}
          <span className="ml-auto text-xs font-medium text-muted">{theme === "auto" ? "Auto" : ""}</span>
        </button>
        <div className="mt-auto flex items-center gap-2.5 rounded-xl border border-line bg-paper/80 p-2.5">
          <Avatar profile={profile} />
          <div className="min-w-0 flex-1"><b className="block truncate text-sm leading-tight">{profile.name}</b><small className="block truncate text-muted">{profile.level} · {profile.role}</small></div>
          <button onClick={logout} title="Sign out" aria-label="Sign out" className="rounded-lg p-2 text-muted transition hover:bg-soft hover:text-bad">
            <LogOut size={18} aria-hidden="true" />
          </button>
        </div>
      </aside>

      <main className="mx-auto w-full max-w-[1440px] px-4 pb-28 pt-5 sm:px-6 lg:px-10 lg:pb-12 lg:pt-8">
        <div key={pathname} className="animate-view"><Outlet /></div>
      </main>

      {/* mobile tab bar */}
      <nav aria-label="Main" className="mobile-nav fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-line pb-[env(safe-area-inset-bottom)] lg:hidden">
        {LINKS.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.end}
            className={({ isActive }) => `relative flex h-16 flex-col items-center justify-center gap-0.5 text-[.74rem] font-semibold transition-colors ${isActive ? "text-cobalt" : "text-muted"}`}>
            {({ isActive }) => (
              <>
                {isActive && <span className="absolute top-0 h-[3px] w-7 rounded-b bg-cobalt" />}
                <span className={`transition-transform ${isActive ? "-translate-y-0.5 scale-110" : ""}`}><NavIcon name={l.key} /></span>
                {l.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <Drawer />
      <Toast />
    </div>
  );
}
