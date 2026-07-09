import { NextRequest } from "next/server";

import { orgFetch } from "@/lib/org-api";

const passthrough = async (res: Response) =>
  new Response(await res.text(), { status: res.status, headers: { "Content-Type": "application/json" } });

// The signed-in account's talent profile (users service — orgFetch sends
// x-auth-token per routing rule #2). 404 = not a talent account.
export async function GET() {
  return passthrough(await orgFetch("/users/talent/me"));
}

export async function PUT(req: NextRequest) {
  const body = await req.text();
  return passthrough(await orgFetch("/users/talent/me", { method: "PUT", body }));
}
