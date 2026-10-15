import { useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, BarChart3, Eye, EyeOff, KeyRound, LoaderCircle, LockKeyhole, Mail, MessageSquareText, ShieldCheck, Sparkles, Target, UserRound } from "lucide-react";
import ProfileForm from "../components/ProfileForm";
import Seg from "../components/Seg";
import { useApp } from "../context/AppContext";
import { COLORS } from "../lib/utils";

const PERKS = [
  { title: "Your own account", detail: "Private profile, history and progress.", icon: UserRound },
  { title: "Questions made for you", detail: "Practice tailored to your role and goals.", icon: Target },
  { title: "Real score analysis", detail: "Track skills, streaks and improvement.", icon: BarChart3 },
];

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
const isStrongPassword = (value) => {
  if (value.length < 8) return false;
  const checks = [/[a-z]/.test(value), /[A-Z]/.test(value), /\d/.test(value), /[^A-Za-z0-9]/.test(value)];
  return checks.filter(Boolean).length >= 2;
};

export default function Auth() {
  const { login, register, requestPasswordReset, resetPasswordWithOtp } = useApp();
  const [mode, setMode] = useState("register");
  const [form, setForm] = useState({ name: "", role: "", level: "Mid", goal: 8, weekly: 3, color: COLORS[0] });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [err, setErr] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  async function resendCode() {
    setErr("");
    setNotice("");
    setBusy(true);
    try {
      await requestPasswordReset(email.trim());
      setOtp("");
      setNotice("If an account exists for that email, a new reset code has been sent.");
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setBusy(false);
    }
  }

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setNotice("");

    if (mode === "register") {
      if (!form.name.trim()) return setErr("Enter your name.");
      if (!form.role.trim()) return setErr("Enter the role you are preparing for.");
    }

    const cleanEmail = email.trim();
    if (!cleanEmail) return setErr("Enter your email.");
    if (!isValidEmail(cleanEmail)) return setErr("Enter a valid email address.");

    if (mode === "forgot") {
      if (!otpSent) {
        setBusy(true);
        try {
          await requestPasswordReset(cleanEmail);
          setOtpSent(true);
          setNotice("If an account exists for that email, a reset code has been sent.");
        } catch (ex) {
          setErr(ex.message);
        } finally {
          setBusy(false);
        }
        return;
      }

      if (!otp.trim()) return setErr("Enter the OTP code sent to your email.");
      if (!newPassword || !isStrongPassword(newPassword)) return setErr("Use a strong password with at least 8 characters, uppercase, lowercase, and a number.");

      setBusy(true);
      try {
        await resetPasswordWithOtp(cleanEmail, otp, newPassword);
        setMode("login");
        setPassword("");
        setOtpSent(false);
        setOtp("");
        setNewPassword("");
        setNotice("Password updated. Sign in with your new password.");
      } catch (ex) {
        setErr(ex.message);
      } finally {
        setBusy(false);
      }
      return;
    }

    if (mode === "login") {
      if (!password || password.length < 8) return setErr("Password must be at least 8 characters.");
    } else if (!password || !isStrongPassword(password)) {
      return setErr("Use a strong password with at least 8 characters, uppercase, lowercase, and a number.");
    }

    setBusy(true);
    try {
      if (mode === "login") await login(cleanEmail, password);
      else await register({ ...form, name: form.name.trim(), role: form.role.trim(), email: cleanEmail, password });
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen lg:grid lg:grid-cols-[minmax(340px,0.88fr)_minmax(520px,1.12fr)]">
        <motion.aside
          initial={{ opacity: 0, x: -18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="relative isolate flex min-h-[310px] flex-col justify-between overflow-hidden px-6 py-6 text-white sm:px-10 sm:py-8 lg:min-h-screen lg:px-12 lg:py-10"
          style={{ backgroundImage: "linear-gradient(135deg, #102b3d 0%, #12514a 54%, #183657 100%)" }}
        >
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 opacity-[0.12]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.55) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.55) 1px, transparent 1px)", backgroundSize: "38px 38px" }} />
          <header className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-lg font-extrabold">
              <span className="grid h-11 w-11 place-items-center rounded-xl border border-white/20 bg-white/10"><MessageSquareText size={21} strokeWidth={2.2} /></span>
              <span>Interview Coach</span>
            </div>
            <span className="hidden items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/85 sm:inline-flex"><ShieldCheck size={14} /> Private by design</span>
          </header>

          <div className="relative mt-10 max-w-[620px] lg:mt-0">
            <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="mb-4 flex items-center gap-2 text-xs font-bold uppercase text-emerald-100">
              <Sparkles size={15} /> Your next interview starts here
            </motion.p>
            <motion.h2 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.55 }} className="max-w-[560px] text-4xl font-extrabold leading-[1.08] sm:text-5xl lg:text-[3.35rem]">
              Practise with intent.<br />Show up <span className="underline decoration-marker decoration-[5px] underline-offset-[7px]">ready.</span>
            </motion.h2>
            <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-5 max-w-[48ch] text-base leading-7 text-white/75 sm:text-lg">
              Build confidence with focused interview practice, thoughtful feedback and progress you can actually see.
            </motion.p>
            <ul className="mt-8 hidden max-w-[530px] gap-5 sm:grid">
              {PERKS.map(({ title, detail, icon: Icon }, index) => (
                <motion.li key={title} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.36 + index * 0.1 }} className="flex items-center gap-4 border-t border-white/15 pt-4">
                  <span className="grid h-10 w-10 flex-none place-items-center rounded-lg bg-white/10 text-emerald-100"><Icon size={19} /></span>
                  <span><b className="block text-sm">{title}</b><span className="mt-0.5 block text-sm text-white/65">{detail}</span></span>
                </motion.li>
              ))}
            </ul>
          </div>

          <footer className="mt-8 flex items-center justify-between border-t border-white/15 pt-4 text-xs text-white/65 lg:mt-0">
            <span>Practice. Reflect. Improve.</span>
            <span className="inline-flex items-center gap-1.5"><ShieldCheck size={14} /> Your progress stays yours</span>
          </footer>
        </motion.aside>

        <main className="relative flex items-start justify-center px-4 py-8 sm:px-8 sm:py-12 lg:items-center lg:px-12 lg:py-10">
          <motion.form initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12, duration: 0.5 }} onSubmit={submit} className="w-full max-w-[480px]" noValidate>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={mode} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2, ease: "easeOut" }}>
                <div className="mb-6 flex items-center justify-between gap-3">
                  <p className="flex items-center gap-2 text-xs font-bold uppercase text-muted"><span className="h-2 w-2 rounded-full bg-good" /> Account access</p>
                  {mode === "forgot" && <span className="text-xs font-semibold text-muted">Secure reset</span>}
                </div>
                <h1 className="!text-4xl !leading-tight">
                  {mode === "forgot" ? <>Reset your <span className="mark">password</span></> : mode === "login" ? <>Welcome <span className="mark">back</span></> : <>Create your <span className="mark">account</span></>}
                </h1>
                <p className="sub mb-6">{mode === "forgot" ? "Enter your email to receive a password reset code." : mode === "login" ? "Sign in to see your dashboard and continue practising." : "Set up your student profile. It takes a minute."}</p>

                {mode !== "forgot" && (
                  <div className="mb-6"><Seg label="Mode" options={["register", "login"]} value={mode} onChange={(nextMode) => { setMode(nextMode); setErr(""); setNotice(""); setOtpSent(false); setOtp(""); setNewPassword(""); }} /></div>
                )}

                {mode === "register" && <ProfileForm value={form} onChange={(patch) => setForm((current) => ({ ...current, ...patch }))} />}

                <div className="mb-5">
                  <label className="label" htmlFor="email">Email</label>
                  <div className="relative">
                    <Mail aria-hidden="true" size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                    <input id="email" type="email" autoComplete="email" className="input pl-11" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
                  </div>
                </div>

                {mode === "forgot" ? (
                  <>
                    <AnimatePresence initial={false}>
                      {otpSent && (
                        <motion.div key="otp-fields" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }}>
                          <div className="mb-4">
                            <label className="label" htmlFor="otp">OTP code</label>
                            <div className="relative">
                              <KeyRound aria-hidden="true" size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                              <input id="otp" type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} pattern="[0-9]{6}" className="input pl-11" value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" />
                            </div>
                          </div>
                          <div className="mb-4">
                            <label className="label" htmlFor="newPassword">New password</label>
                            <div className="relative">
                              <LockKeyhole aria-hidden="true" size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                              <input id="newPassword" type={showNewPassword ? "text" : "password"} autoComplete="new-password" className="input pl-11 pr-12" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="Choose a strong password" />
                              <button type="button" aria-label={showNewPassword ? "Hide new password" : "Show new password"} onClick={() => setShowNewPassword((visible) => !visible)} className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-muted transition hover:bg-soft hover:text-ink">
                                {showNewPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <button className="btn-primary mt-1 w-full gap-2 text-base" disabled={busy}>
                      {busy ? <LoaderCircle size={18} className="animate-spin" /> : otpSent ? <LockKeyhole size={18} /> : <Mail size={18} />}
                      {busy ? "Please wait…" : otpSent ? "Reset password" : "Send reset code"}
                    </button>
                    {otpSent && <button type="button" className="mt-3 w-full text-sm font-semibold text-cobalt hover:underline" disabled={busy} onClick={resendCode}>Send a new code</button>}
                    <button type="button" className="btn-ghost mt-3 w-full gap-2" onClick={() => { setMode("login"); setErr(""); setNotice(""); setOtpSent(false); setOtp(""); setNewPassword(""); }}><ArrowLeft size={17} /> Back to sign in</button>
                  </>
                ) : (
                  <>
                    <div className="mb-5">
                      <label className="label" htmlFor="password">Password</label>
                      <div className="relative">
                        <LockKeyhole aria-hidden="true" size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                        <input id="password" type={showPassword ? "text" : "password"} autoComplete={mode === "login" ? "current-password" : "new-password"} className="input pl-11 pr-12" value={password} onChange={(event) => setPassword(event.target.value)} placeholder={mode === "register" ? "At least 8 characters" : "Your password"} />
                        <button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((visible) => !visible)} className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-muted transition hover:bg-soft hover:text-ink">
                          {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                        </button>
                      </div>
                    </div>
                    <button className="btn-primary w-full gap-2 text-base" disabled={busy}>
                      {busy ? <LoaderCircle size={18} className="animate-spin" /> : mode === "login" ? <ArrowRight size={18} /> : <Sparkles size={18} />}
                      {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
                    </button>
                    {mode === "login" && <button type="button" className="mt-4 w-full text-center text-sm font-semibold text-cobalt underline-offset-2 hover:underline" onClick={() => { setMode("forgot"); setErr(""); setNotice(""); setOtpSent(false); setOtp(""); setNewPassword(""); }}>Forgot password?</button>}
                  </>
                )}

                <AnimatePresence initial={false}>
                  {err && <motion.p key="error" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} role="alert" className="mt-4 whitespace-pre-wrap break-words rounded-lg border border-bad/20 bg-bad/5 px-3.5 py-3 text-sm font-semibold text-bad">{err}</motion.p>}
                  {notice && <motion.p key="notice" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} role="status" className="mt-4 rounded-lg border border-good/20 bg-good/5 px-3.5 py-3 text-sm font-semibold text-good">{notice}</motion.p>}
                </AnimatePresence>

                <p className="mt-7 flex items-center justify-center gap-2 border-t border-line pt-5 text-xs text-muted"><ShieldCheck size={15} /> Your information is encrypted and private</p>
              </motion.div>
            </AnimatePresence>
          </motion.form>
        </main>
      </div>
    </MotionConfig>
  );
}
