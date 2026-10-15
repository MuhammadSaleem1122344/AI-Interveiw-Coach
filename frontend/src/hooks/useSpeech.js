import { useEffect, useRef, useState } from "react";

/** Voice dictation via the browser Web Speech API (works in Chrome/Edge/Safari). */
export function useSpeech(onText) {
  const [on, setOn] = useState(false);
  const ref = useRef(null);
  const R = typeof window !== "undefined" ? window.SpeechRecognition || window.webkitSpeechRecognition : null;

  const toggle = () => {
    if (!R) return;
    if (on) { ref.current?.stop(); return; }
    const r = new R();
    r.lang = "en-US";
    r.continuous = true;
    r.interimResults = false;
    r.onresult = (e) => {
      let t = "";
      for (let i = e.resultIndex; i < e.results.length; i++) if (e.results[i].isFinal) t += e.results[i][0].transcript;
      if (t) onText(t.trim());
    };
    r.onend = () => setOn(false);
    r.onerror = () => setOn(false);
    ref.current = r;
    r.start();
    setOn(true);
  };

  useEffect(() => () => ref.current?.stop(), []);
  return { supported: !!R, on, toggle };
}
