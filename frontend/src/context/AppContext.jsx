import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { api, del, get, getToken, put, request, setOnUnauthorized, setToken } from "../lib/api";

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

const THEME_KEY = "ic.theme";
const readTheme = () => { try { return localStorage.getItem(THEME_KEY) || "auto"; } catch { return "auto"; } };

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [ready, setReady] = useState(!getToken());
  const [toastMsg, setToastMsg] = useState("");
  const [openId, setOpenId] = useState(null);
  const [localTheme, setLocalTheme] = useState(readTheme);
  const timer = useRef();

  const toast = useCallback((m) => {
    setToastMsg(m);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToastMsg(""), 2600);
  }, []);

  const clearLocal = useCallback(() => {
    setToken(""); setUser(null); setSessions([]); setOpenId(null);
    if (typeof window !== "undefined") window.location.hash = "#/"; // next student starts on the dashboard
  }, []);

  // restore the signed-in student on page load
  useEffect(() => {
    setOnUnauthorized(() => { clearLocal(); });
    if (!getToken()) return;
    (async () => {
      try {
        const [me, ss] = await Promise.all([get("/api/me"), get("/api/sessions")]);
        setUser(me); setSessions(ss);
      } catch { setToken(""); }
      finally { setReady(true); }
    })();
  }, [clearLocal]);

  // theme: auto | light | dark
  const theme = user?.theme || localTheme;
  useEffect(() => {
    const mq = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
    const apply = () => document.documentElement.classList.toggle("dark", theme === "dark" || (theme === "auto" && !!mq?.matches));
    apply();
    mq?.addEventListener?.("change", apply);
    return () => mq?.removeEventListener?.("change", apply);
  }, [theme]);

  const authenticate = useCallback(async (path, body) => {
    const res = await api(path, body);
    setToken(res.token);
    const ss = await get("/api/sessions");
    setUser(res.user); setSessions(ss);
    return res.user;
  }, []);
  const login = (email, password) => authenticate("/api/auth/login", { email, password });
  const register = (data) => authenticate("/api/auth/register", data);
  const requestPasswordReset = useCallback((email) => api("/api/auth/password-reset/request", { email }), []);
  const resetPasswordWithOtp = useCallback((email, otp, password) => api("/api/auth/password-reset/confirm", { email, otp, password }), []);
  const logout = useCallback(() => { clearLocal(); toast("Signed out"); }, [clearLocal, toast]);

  const updateProfile = useCallback(async (patch) => {
    const u = await put("/api/me", patch);
    setUser(u);
    return u;
  }, []);
  const setTheme = useCallback((t) => {
    try { localStorage.setItem(THEME_KEY, t); } catch {}
    setLocalTheme(t);
    if (user) updateProfile({ theme: t }).catch(() => {});
  }, [user, updateProfile]);

  const addSession = useCallback(async (s) => {
    const saved = await request("POST", "/api/sessions", s);
    setSessions((p) => [...p, saved]);
    return saved;
  }, []);
  const deleteSession = useCallback(async (id) => {
    await del(`/api/sessions/${id}`);
    setSessions((p) => p.filter((s) => s.id !== id));
  }, []);
  const clearSessions = useCallback(async () => { await del("/api/sessions"); setSessions([]); }, []);
  const deleteAccount = useCallback(async () => { await del("/api/me"); clearLocal(); }, [clearLocal]);

  const value = useMemo(
    () => ({ user, sessions, ready, login, register, requestPasswordReset, resetPasswordWithOtp, logout, updateProfile, theme, setTheme, addSession, deleteSession, clearSessions, deleteAccount, toast, toastMsg, openId, setOpenId }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, sessions, ready, theme, toastMsg, openId, setTheme, logout, updateProfile, addSession, deleteSession, clearSessions, deleteAccount, toast, requestPasswordReset, resetPasswordWithOtp]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
