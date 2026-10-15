import { useApp } from "../context/AppContext";

export default function Toast() {
  const { toastMsg } = useApp();
  return (
    <div role="status" className={`pointer-events-none fixed bottom-24 left-1/2 z-[80] max-w-[90vw] -translate-x-1/2 rounded-xl bg-ink px-4 py-2.5 font-semibold text-paper transition-all duration-300 lg:bottom-6 ${toastMsg ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}>
      {toastMsg}
    </div>
  );
}
