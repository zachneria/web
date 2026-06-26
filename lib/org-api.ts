// Authenticated server-side calls for the organizer dashboard. Reads the id
// token from the httpOnly cookie and sends it as a Bearer token, exactly like
// the app's api client (non-/users services use Authorization). Server-only.
import { cookies } from "next/headers";

import { ID_COOKIE } from "./org-auth";

const API_BASE = process.env.API_BASE_URL || "https://api.fansonly.live";

async function orgFetch(path: string): Promise<Response | null> {
  const store = await cookies();
  const idToken = store.get(ID_COOKIE)?.value;
  if (!idToken) return null;
  try {
    return await fetch(`${API_BASE}${path}`, {
      headers: { Authorization: `Bearer ${idToken}` },
      cache: "no-store",
    });
  } catch {
    return null;
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

// Per-event rollups from fo-events GET /events/summary (best-effort).
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
  const events: DashEvent[] = evRes && evRes.ok ? await evRes.json().catch(() => []) : [];
  let summary: Record<string, DashSummary> = {};
  if (sumRes && sumRes.ok) {
    const raw = await sumRes.json().catch(() => null);
    // /events/summary returns either a map or an array keyed by id — normalize.
    if (Array.isArray(raw)) {
      summary = Object.fromEntries(raw.map((s: DashSummary & { id: string }) => [s.id, s]));
    } else if (raw && typeof raw === "object") {
      summary = raw;
    }
  }
  return { events, summary };
}
