const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5062";
const TOKEN_COOKIE = "nm_token";
const TOKEN_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

// ── Token helpers ────────────────────────────────────────────────────────────

export function getToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp("(?:^|; )" + TOKEN_COOKIE + "=([^;]*)")
  );
  return match ? decodeURIComponent(match[1]) : null;
}

export function setToken(token: string): void {
  document.cookie = [
    `${TOKEN_COOKIE}=${encodeURIComponent(token)}`,
    `path=/`,
    `max-age=${TOKEN_MAX_AGE}`,
    `SameSite=Strict`,
  ].join("; ");
}

export function clearToken(): void {
  document.cookie = `${TOKEN_COOKIE}=; path=/; max-age=0`;
}

// ── Username helpers ─────────────────────────────────────────────────────────

const NAME_CLAIM = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name";

function usernameFromToken(token: string): string | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload[NAME_CLAIM] ?? null;
  } catch {
    return null;
  }
}

export function setUsername(name: string): void {
  if (typeof localStorage !== "undefined" && name) localStorage.setItem("nm_user", name);
}

export function getUsername(): string | null {
  if (typeof localStorage !== "undefined") {
    const val = localStorage.getItem("nm_user");
    if (val && val !== "undefined") return val;
  }
  // Fall back to decoding the JWT so the name is always available.
  const token = getToken();
  return token ? usernameFromToken(token) : null;
}

export function clearUsername(): void {
  if (typeof localStorage !== "undefined") localStorage.removeItem("nm_user");
}

// ── Raw fetch wrapper ────────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error");
    throw new ApiError(res.status, text);
  }

  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return res.json() as Promise<T>;
  }
  return res as unknown as T;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
  }
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthResponse {
  token: string;
  username: string;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function register(
  username: string,
  email: string,
  password: string
): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ username, email, password }),
  });
}

// ── Sessions ─────────────────────────────────────────────────────────────────

export interface Session {
  id: number;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export async function getSessions(): Promise<Session[]> {
  return apiFetch<Session[]>("/api/sessions");
}

export async function createSession(title?: string): Promise<Session> {
  return apiFetch<Session>("/api/sessions", {
    method: "POST",
    body: JSON.stringify({ title: title ?? null }),
  });
}

export async function renameSession(id: number, title: string): Promise<Session> {
  return apiFetch<Session>(`/api/sessions/${id}/title`, {
    method: "PATCH",
    body: JSON.stringify({ title }),
  });
}

export async function deleteSession(id: number): Promise<void> {
  await apiFetch<void>(`/api/sessions/${id}`, { method: "DELETE" });
}

// ── Messages ─────────────────────────────────────────────────────────────────

export interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export async function getMessages(sessionId: number): Promise<Message[]> {
  return apiFetch<Message[]>(`/api/sessions/${sessionId}/messages`);
}

/**
 * Sends a user message and streams the assistant response via SSE.
 * Calls onChunk for each text fragment, onDone when the stream ends.
 */
export async function sendMessage(
  sessionId: number,
  content: string,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (err: Error) => void
): Promise<void> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "text/event-stream",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api/sessions/${sessionId}/messages`, {
      method: "POST",
      headers,
      body: JSON.stringify({ content }),
    });
  } catch (err) {
    onError(err instanceof Error ? err : new Error(String(err)));
    return;
  }

  if (!res.ok || !res.body) {
    onError(new ApiError(res.status, await res.text().catch(() => "Stream failed")));
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (line.startsWith("event: done")) {
          onDone();
          return;
        }
        if (line.startsWith("data: ")) {
          try {
            const chunk: string = JSON.parse(line.slice(6));
            onChunk(chunk);
          } catch {
            // skip malformed line
          }
        }
      }
    }
    onDone();
  } catch (err) {
    onError(err instanceof Error ? err : new Error(String(err)));
  } finally {
    reader.releaseLock();
  }
}
