import { NextRequest, NextResponse } from "next/server";
import { getOrder } from "@/lib/backend";

// GET /api/order?token=<viewToken> — proxies the order view so the success
// screen can poll for the issued tickets.
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }
  const res = await getOrder(token);
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
