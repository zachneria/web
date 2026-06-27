import { orgFetch } from "@/lib/org-api";

// GET /api/dashboard/events — the organizer's events (for the blast show picker).
export async function GET() {
  const res = await orgFetch("/events");
  const body = await res.text();
  return new Response(body, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}
