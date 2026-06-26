import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { ID_COOKIE, RT_COOKIE } from "@/lib/org-auth";

// POST /api/auth/logout — clears the organizer session cookies.
export async function POST() {
  const store = await cookies();
  store.delete(ID_COOKIE);
  store.delete(RT_COOKIE);
  return NextResponse.json({ ok: true });
}
