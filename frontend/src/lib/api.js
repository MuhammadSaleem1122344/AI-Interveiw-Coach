const BASE = import.meta.env.VITE_API_URL || "";
const KEY = "ic.token";

let token = "";
try { token = localStorage.getItem(KEY) || ""; } catch {}
let onUnauthorized = null;

export const getToken = () => token;
export const setToken = (t) => {
  token = t || "";
  try { t ? localStorage.setItem(KEY, t) : localStorage.removeItem(KEY); } catch {}
};
export const setOnUnauthorized = (fn) => { onUnauthorized = fn; };

export async function request(method, path, body) {
  let r;
  try {
    r = await fetch(BASE + path, {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new Error("Cannot reach the server. Is the backend running?");
  }

  if (!r.ok) {
    const t = await r.text();
    let msg = t;
    try {
      const d = JSON.parse(t);
      msg = typeof d.detail === "string"
        ? d.detail
        : Array.isArray(d.detail)
          ? d.detail.map((x) => x.msg).join(", ")
          : JSON.stringify(d.detail);
    } catch {}

    if (r.status === 401 && token && !path.startsWith("/api/auth/")) onUnauthorized?.();

    const reuseExactErrorCode = [401, 409, 422].includes(r.status);
    throw new Error(reuseExactErrorCode ? msg : `${r.status}: ${msg}`);
  }

  const text = await r.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}


export const api = (path, body) => request("POST", path, body);
export const get = (path) => request("GET", path);
export const put = (path, body) => request("PUT", path, body);
export const del = (path) => request("DELETE", path);
