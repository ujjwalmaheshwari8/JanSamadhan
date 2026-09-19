import type {
  AuditLog,
  Complaint,
  DashboardOverview,
  Hotspot,
  Incident,
  User,
  WorkOrder,
} from "./types";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1").replace(/\/$/, "");
const ROOT_BASE = API_BASE.replace(/\/api\/v1$/, "");
const TOKEN_KEY = "civic_intel_token";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  window.localStorage.removeItem(TOKEN_KEY);
}

let onUnauthorized: (() => void) | null = null;
export function registerUnauthorizedHandler(fn: () => void) {
  onUnauthorized = fn;
}

async function request<T>(path: string, options: RequestInit = {}, opts: { root?: boolean } = {}): Promise<T> {
  const base = opts.root ? ROOT_BASE : API_BASE;
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  };
  if (!(options.body instanceof URLSearchParams)) {
    headers["Content-Type"] = "application/json";
  }
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${base}${path}`, { ...options, headers });
  } catch (e) {
    throw new ApiError(0, "Network error — unable to reach the JanSamadhan API. Check that the backend is running.");
  }

  if (res.status === 401) {
    clearToken();
    if (onUnauthorized) onUnauthorized();
    throw new ApiError(401, "Session expired. Please sign in again.");
  }

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const data = await res.json();
      detail = data.detail || JSON.stringify(data);
    } catch {
      /* noop */
    }
    throw new ApiError(res.status, typeof detail === "string" ? detail : "Request failed");
  }

  if (res.status === 204) return undefined as unknown as T;
  return (await res.json()) as T;
}

export const api = {
  health: () => request<{ status: string; database: boolean; ai_provider: string }>("/health", {}, { root: true }),

  login: async (email: string, password: string) => {
    const body = new URLSearchParams();
    body.set("username", email);
    body.set("password", password);
    return request<{ access_token: string; token_type: string; user: User }>("/auth/login", {
      method: "POST",
      body,
    });
  },
  me: () => request<User>("/auth/me"),

  createComplaint: (data: { description: string; category?: string; lat: number; lon: number; urgency?: string }) =>
    request<Complaint & { ai: any }>("/complaints", { method: "POST", body: JSON.stringify(data) }),
  myComplaints: () => request<Complaint[]>("/complaints/mine"),
  getComplaint: (id: string) => request<Complaint>(`/complaints/${id}`),
  submitFeedback: (id: string, data: { resolved: boolean; rating?: number; comment?: string }) =>
    request<{ id: string; status: string; feedback: any }>(`/complaints/${id}/feedback`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  incidents: () => request<Incident[]>("/incidents"),
  incident: (id: string) => request<Incident>(`/incidents/${id}`),
  relatedComplaints: (id: string) => request<Complaint[]>(`/incidents/${id}/related-complaints`),

  overview: () => request<DashboardOverview>("/dashboard/overview"),
  emerging: () => request<Incident[]>("/dashboard/emerging"),
  hotspots: () => request<Hotspot[]>("/dashboard/hotspots"),

  workOrders: () => request<WorkOrder[]>("/work-orders"),
  createWorkOrder: (data: { incident_id: string; action: string }) =>
    request<WorkOrder>("/work-orders", { method: "POST", body: JSON.stringify(data) }),
  updateWorkOrderStatus: (id: string, status: string) =>
    request<WorkOrder>(`/work-orders/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }),

  auditLogs: () => request<AuditLog[]>("/audit-logs"),
};
