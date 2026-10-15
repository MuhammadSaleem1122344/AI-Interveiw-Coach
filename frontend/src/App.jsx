import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import Layout from "./components/Layout";
import { AppProvider, useApp } from "./context/AppContext";
import { PracticeProvider } from "./context/PracticeContext";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import History from "./pages/History";
import Practice from "./pages/Practice";
import Profile from "./pages/Profile";
import Toast from "./components/Toast";

function Gate() {
  const { user, ready } = useApp();
  if (!ready)
    return (
      <div className="grid min-h-screen place-items-center text-muted">
        <div className="flex gap-1.5">{[0, 0.18, 0.36].map((d) => <i key={d} className="h-2.5 w-2.5 animate-blink rounded-full bg-cobalt" style={{ animationDelay: `${d}s` }} />)}</div>
      </div>
    );
  if (!user) return (<><Auth /><Toast /></>);
  return (
    // key = student id, so one student's in-progress interview never leaks to the next
    <PracticeProvider key={user.id}>
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="practice" element={<Practice />} />
            <Route path="history" element={<History />} />
            <Route path="profile" element={<Profile />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </PracticeProvider>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <Gate />
      </AppProvider>
    </ErrorBoundary>
  );
}
