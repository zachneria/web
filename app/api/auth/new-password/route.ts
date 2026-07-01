import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import {
  cognitoCompleteNewPassword,
  ID_COOKIE,
  ID_MAX_AGE,
  RT_COOKIE,
  RT_MAX_AGE,
} from "@/lib/org-auth";

// POST /api/auth/new-password { email, session, newPassword }
// Completes the first-login NEW_PASSWORD_REQUIRED challenge and, on success,
// sets the same httpOnly session cookies as a normal sign-in.
export async function POST(req: NextRequest) {
  let email = "";
  let session = "";
  let newPassword = "";
  try {
    ({ email, session, newPassword } = await req.json());
  } catch {
    /* handled below */
  }
  if (!email || !session || !newPassword) {
    return NextResponse.json(
      { error: "Something went wrong — start sign-in again." },
      { status: 400 },
    );
  }
  if (newPassword.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 },
    );
  }

  try {
    const r = await cognitoCompleteNewPassword(email.trim(), session, newPassword);
    const store = await cookies();
    const base = { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/" };
    store.set(ID_COOKIE, r.idToken, { ...base, maxAge: ID_MAX_AGE });
    store.set(RT_COOKIE, r.refreshToken, { ...base, maxAge: RT_MAX_AGE });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const code = (err as { code?: string }).code || "";
    const msg = /InvalidPassword/i.test(code)
      ? "That password doesn't meet the requirements — try a longer / stronger one."
      : /NotAuthorized|Expired|Session|CodeMismatch/i.test(code)
        ? "Your sign-in session expired. Sign in again to restart."
        : "Couldn't set your password. Try again.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
