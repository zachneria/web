import { NextRequest } from "next/server";

import { orgFetch } from "@/lib/org-api";

// GET /api/dashboard/talent-search?q= — discoverable-talent autocomplete for
// the cost form (users service; orgFetch sends x-auth-token per routing rule).
// Not part of the generic proxy: /users/* stays off that allowlist on purpose.
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  const res = await orgFetch(`/users/talent/search?q=${encodeURIComponent(q)}`);
  return new Response(await res.text(), {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}
