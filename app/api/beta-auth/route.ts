import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// POST /api/beta-auth — verify the shared beta password and set a cookie so the
// /beta page renders server-side (content never reaches an unauthenticated
// client). The password lives in the BETA_PASSWORD env var (set in Vercel).
export async function POST(req: NextRequest) {
  const expected = process.env.BETA_PASSWORD;
  let password = "";
  try {
    ({ password } = await req.json());
  } catch {
    /* fall through to the failure below */
  }
  if (!expected || password !== expected) {
    return NextResponse.json({ error: "Wrong access code." }, { status: 401 });
  }
  const store = await cookies();
  store.set("beta_auth", expected, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  return NextResponse.json({ ok: true });
}
