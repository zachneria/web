import { NextRequest } from "next/server";

import { getOrgClaims, orgFetch } from "@/lib/org-api";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
const passthrough = async (res: Response) =>
  new Response(await res.text(), { status: res.status, headers: { "Content-Type": "application/json" } });

// GET /api/dashboard/profile — the organizer's User row (name, logoUrl, handle).
export async function GET() {
  const { sub } = await getOrgClaims();
  if (!sub) return json({ error: "Not signed in" }, 401);
  return passthrough(await orgFetch(`/users/${sub}`));
}

// PUT /api/dashboard/profile — update { handle } or { logoUrl }.
export async function PUT(req: NextRequest) {
  const { sub } = await getOrgClaims();
  if (!sub) return json({ error: "Not signed in" }, 401);
  const body = await req.text();
  return passthrough(await orgFetch(`/users/${sub}`, { method: "PUT", body }));
}
