import { NextRequest, NextResponse } from "next/server";

import { cognitoConfirmForgotPassword, cognitoForgotPassword } from "@/lib/org-auth";

// POST /api/auth/forgot
//   { email }                      → emails a reset code
//   { email, code, newPassword }   → confirms the code + sets the password
// Public (pre-login). Replies generically on the send step so it can't be
// used to probe which emails have accounts.
export async function POST(req: NextRequest) {
  let email = "";
  let code = "";
  let newPassword = "";
  try {
    ({ email = "", code = "", newPassword = "" } = await req.json());
  } catch {
    /* handled below */
  }
  email = email.trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  if (!code) {
    try {
      await cognitoForgotPassword(email);
    } catch {
      // Unknown user / not confirmed / rate limited — same generic reply.
    }
    return NextResponse.json({ ok: true });
  }

  if (!newPassword) {
    return NextResponse.json({ error: "New password is required." }, { status: 400 });
  }
  try {
    await cognitoConfirmForgotPassword(email, code.trim(), newPassword);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const c = (err as { code?: string }).code || "";
    if (/CodeMismatch|ExpiredCode/.test(c)) {
      return NextResponse.json({ error: "That code is wrong or expired." }, { status: 400 });
    }
    if (/InvalidPassword/.test(c)) {
      return NextResponse.json(
        { error: "Password needs 8+ characters with an upper case, lower case, and number." },
        { status: 400 },
      );
    }
    if (/LimitExceeded/.test(c)) {
      return NextResponse.json(
        { error: "Too many attempts — wait a bit and try again." },
        { status: 429 },
      );
    }
    return NextResponse.json({ error: "Couldn't reset the password. Try again." }, { status: 400 });
  }
}
