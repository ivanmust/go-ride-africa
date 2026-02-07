/**
 * API client for GoRide backend (Postgres). Use when VITE_API_URL is set.
 * Use setApiStorageKey() in each app (driver, admin) so tokens don't clash with passenger.
 */
const DEFAULT_STORAGE_KEY = "goride_api_token";
let storageKey = DEFAULT_STORAGE_KEY;

export function getApiBaseUrl(): string {
  return (import.meta.env.VITE_API_URL as string) || "";
}

export function usePostgresApi(): boolean {
  return !!getApiBaseUrl();
}

/** Set storage key for token (e.g. driver app: "goride_api_token_driver", admin: "goride_api_token_admin"). Call once when app mounts. */
export function setApiStorageKey(key: string): void {
  storageKey = key;
}

export function getToken(): string | null {
  try {
    return localStorage.getItem(storageKey);
  } catch {
    return null;
  }
}

export function setToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(storageKey, token);
    else localStorage.removeItem(storageKey);
  } catch {
    // ignore
  }
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<{ data?: T; error?: { message: string } }> {
  const base = getApiBaseUrl().replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  const url = p.startsWith("/api/") ? `${base}${p}` : `${base}/api${p}`;
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data: T | undefined;
  if (text) {
    try {
      data = JSON.parse(text) as T;
    } catch {
      // non-JSON response
    }
  }

  if (!res.ok) {
    const err = data && typeof data === "object" && "error" in data
      ? (data as { error: string }).error
      : res.statusText || "Request failed";
    return { error: { message: typeof err === "string" ? err : JSON.stringify(err) } };
  }

  return { data: data as T };
}

async function uploadForm<T>(path: string, formData: FormData): Promise<{ data?: T; error?: { message: string } }> {
  const base = getApiBaseUrl().replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  const url = p.startsWith("/api/") ? `${base}${p}` : `${base}/api${p}`;
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url, { method: "POST", headers, body: formData });
  const text = await res.text();
  let data: T | undefined;
  if (text) {
    try {
      data = JSON.parse(text) as T;
    } catch {
      // non-JSON
    }
  }
  if (!res.ok) {
    const err = data && typeof data === "object" && "error" in data ? (data as { error: string }).error : res.statusText || "Request failed";
    return { error: { message: typeof err === "string" ? err : JSON.stringify(err) } };
  }
  return { data: data as T };
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, body),
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, body),
  delete: (path: string) => request<unknown>("DELETE", path),
  uploadForm: <T>(path: string, formData: FormData) => uploadForm<T>(path, formData),
};
