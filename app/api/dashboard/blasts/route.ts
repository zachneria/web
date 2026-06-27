import { NextRequest } from "next/server";

import { orgFetch } from "@/lib/org-api";

const passthrough = async (res: Response) =>
  new Response(await res.text(), {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });

// GET /api/dashboard/blasts — audience size + past blasts.
export async function GET() {
  return passthrough(await orgFetch("/tickets/blasts"));
}

// POST /api/dashboard/blasts — send a blast.
export async function POST(req: NextRequest) {
  const body = await req.text();
  return passthrough(await orgFetch("/tickets/blasts", { method: "POST", body }));
}
