import { NextRequest } from "next/server";

import { getOrgClaims, orgFetch } from "@/lib/org-api";

// Generic authenticated proxy for client-side dashboard writes/reads. Forwards
// /api/dashboard/api/<path> → <API>/<path> with the org bearer attached
// server-side (token never reaches the browser). Allowlisted to the organizer
// surfaces so it can't be used as an open proxy.
const ALLOW = new Set(["events", "guests", "payouts", "tickets"]);
// /users stays out of ALLOW (profile has its own proxy) except the admin
// surface — fo-users 403s non-admins server-side, this gate is just anti-open-proxy.
const isAllowed = (path: string[]) =>
  ALLOW.has(path[0]) || (path[0] === "users" && path[1] === "admin");

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
const pass = async (res: Response) =>
  new Response(await res.text(), { status: res.status, headers: { "Content-Type": "application/json" } });

async function handle(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
  method: string,
) {
  const { sub } = await getOrgClaims();
  if (!sub) return json({ error: "Not signed in" }, 401);
  const { path } = await ctx.params;
  if (!path?.length || !isAllowed(path)) return json({ error: "Not allowed" }, 400);

  const target = "/" + path.map(encodeURIComponent).join("/") + (req.nextUrl.search || "");
  const init: RequestInit = { method };
  if (method !== "GET" && method !== "DELETE") init.body = await req.text();
  return pass(await orgFetch(target, init));
}

export const GET = (req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) =>
  handle(req, ctx, "GET");
export const POST = (req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) =>
  handle(req, ctx, "POST");
export const PUT = (req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) =>
  handle(req, ctx, "PUT");
export const DELETE = (req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) =>
  handle(req, ctx, "DELETE");
