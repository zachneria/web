// Authenticated server-side calls for the organizer dashboard. Reads the id
// token from the httpOnly cookie and sends it as a Bearer token, exactly like
// the app's api client (non-/users services use Authorization). Server-only —
// used by Server Components and by the /api/dashboard/* proxy route handlers
// (so the browser never sees the token; client pages call those proxies).
import { cookies } from "next/headers";

import { ID_COOKIE } from "./org-auth";

const API_BASE = process.env.API_BASE_URL || "https://api.fansonly.live";

// Forward a request to the fansonly API with the organizer's bearer token.
// Returns the raw Response (status passes through), or a 401 Response if there's
// no session.
export async function orgFetch(path: string, init?: RequestInit): Promise<Response> {
  const store = await cookies();
  const idToken = store.get(ID_COOKIE)?.value;
  if (!idToken) {
    return new Response(JSON.stringify({ error: "Not signed in" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      ...(init?.headers || {}),
      Authorization: `Bearer ${idToken}`,
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
    },
    cache: "no-store",
  });
}

// The signed-in organizer's display info, read from the id token claims (the
// token is our own httpOnly cookie, so no verification needed just to display).
export async function getOrgClaims(): Promise<{ email?: string; name?: string }> {
  const store = await cookies();
  const tok = store.get(ID_COOKIE)?.value;
  if (!tok) return {};
  try {
    const payload = JSON.parse(Buffer.from(tok.split(".")[1], "base64").toString());
    return { email: payload.email, name: payload.name };
  } catch {
    return {};
  }
}

export interface DashEvent {
  id: string;
  name: string;
  venueName: string;
  eventDate: string;
  status: "draft" | "published" | "cancelled";
  flyerUrl?: string | null;
  slug?: string | null;
}

export interface DashSummary {
  sold?: number;
  capacity?: number;
  checkedIn?: number;
  guests?: number;
}

export async function getDashboard(): Promise<{
  events: DashEvent[];
  summary: Record<string, DashSummary>;
}> {
  const [evRes, sumRes] = await Promise.all([
    orgFetch("/events"),
    orgFetch("/events/summary"),
  ]);
  const events: DashEvent[] = evRes.ok ? await evRes.json().catch(() => []) : [];
  let summary: Record<string, DashSummary> = {};
  if (sumRes.ok) {
    const raw = await sumRes.json().catch(() => null);
    if (Array.isArray(raw)) {
      summary = Object.fromEntries(raw.map((s: DashSummary & { id: string }) => [s.id, s]));
    } else if (raw && typeof raw === "object") {
      summary = raw;
    }
  }
  return { events, summary };
}
