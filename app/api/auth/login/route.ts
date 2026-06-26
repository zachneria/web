import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import {
  cognitoLogin,
  ID_COOKIE,
  ID_MAX_AGE,
  RT_COOKIE,
  RT_MAX_AGE,
} from "@/lib/org-auth";

// POST /api/auth/login { email, password }
// Logs the organizer in against Cognito and sets httpOnly session cookies.
export async function POST(req: NextRequest) {
  let email = "";
  let password = "";
  try {
    ({ email, password } = await req.json());
  } catch {
    /* handled below */
  }
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  try {
    const r = await cognitoLogin(email.trim(), password);
    if (r.challenge === "NEW_PASSWORD_REQUIRED") {
      // First-login password set isn't on web yet — do it in the app once.
      return NextResponse.json(
        {
          error:
            "Finish setting up your password in the fansonly app first, then sign in here.",
        },
        { status: 409 },
      );
    }
    if (!r.idToken || !r.refreshToken) {
      return NextResponse.json({ error: "Sign-in failed. Try again." }, { status: 401 });
    }
    const store = await cookies();
    const base = { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/" };
    store.set(ID_COOKIE, r.idToken, { ...base, maxAge: ID_MAX_AGE });
    store.set(RT_COOKIE, r.refreshToken, { ...base, maxAge: RT_MAX_AGE });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const code = (err as { code?: string }).code || "";
    const msg = /NotAuthorized|UserNotFound/.test(code)
      ? "Incorrect email or password."
      : "Couldn't sign in right now. Try again.";
    return NextResponse.json({ error: msg }, { status: 401 });
  }
}
