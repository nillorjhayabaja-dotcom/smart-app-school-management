// Centralized API client. Replace BASE_URL via VITE_API_URL when wiring backend.
export const API_BASE = (import.meta as any).env?.VITE_API_URL ?? "/api/v1";

const TOKEN_KEY = "wf.token";
const REFRESH_KEY = "wf.refresh";

export const tokenStore = {
  get: () => (typeof window === "undefined" ? null : localStorage.getItem(TOKEN_KEY)),
  getRefresh: () => (typeof window === "undefined" ? null : localStorage.getItem(REFRESH_KEY)),
  set: (token: string, refresh: string) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

export class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

type Opts = RequestInit & { json?: unknown; auth?: boolean };

export async function apiRequest<T>(path: string, opts: Opts = {}): Promise<T> {
  const { json, auth = true, headers, ...rest } = opts;
  const h = new Headers(headers);
  if (json !== undefined) h.set("Content-Type", "application/json");
  if (auth) {
    const t = tokenStore.get();
    if (t) h.set("Authorization", `Bearer ${t}`);
  }
  const res = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers: h,
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });
  if (res.status === 401 && auth) {
    // Refresh token flow stub (wire real endpoint here)
    tokenStore.clear();
  }
  const text = await res.text();
  const data = text ? safeJson(text) : null;
  if (!res.ok) throw new ApiError(res.status, (data as any)?.message ?? res.statusText, data);
  return data as T;
}

function safeJson(s: string) {
  try { return JSON.parse(s); } catch { return s; }
}
