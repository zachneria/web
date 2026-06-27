import { NextRequest } from "next/server";

import { orgFetch } from "@/lib/org-api";

// POST /api/dashboard/blasts/draft — AI draft / rewrite / subject ideas.
export async function POST(req: NextRequest) {
  const body = await req.text();
  const res = await orgFetch("/tickets/blasts/draft", { method: "POST", body });
  return new Response(await res.text(), {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}
