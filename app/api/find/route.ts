import { NextRequest } from "next/server";

import { browseEvents } from "@/lib/backend";

// Public search proxy for the /events browse page — keeps the browser off
// api.shabanga.com directly (no CORS; API base stays server-side).
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  return Response.json(await browseEvents(q));
}
