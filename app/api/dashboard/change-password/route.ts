import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { cognitoChangePassword, RT_COOKIE } from "@/lib/org-auth";

// POST /api/dashboard/change-password { currentPassword, newPassword }
// Auth = the httpOnly refresh cookie; the access token is minted server-side
// so no Cognito token ever reaches the browser.
export async function POST(req: NextRequest) {
  const store = await cookies();
  const refreshToken = store.get(RT_COOKIE)?.value;
  if (!refreshToken) {
    return NextResponse.json({ error: "Session expired — sign in again." }, { status: 401 });
  }

  let currentPassword = "";
  let newPassword = "";
  try {
    ({ currentPassword, newPassword } = await req.json());
  } catch {
    /* handled below */
  }
  if (!currentPassword || !newPassword) {
    return NextResponse.json(
      { error: "Current and new password are required." },
      { status: 400 },
    );
  }

  try {
    await cognitoChangePassword(refreshToken, currentPassword, newPassword);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const code = (err as { code?: string }).code || "";
    if (/NotAuthorized/.test(code)) {
      return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
    }
    if (/InvalidPassword/.test(code)) {
      return NextResponse.json(
        { error: "New password needs 8+ characters with an upper case, lower case, and number." },
        { status: 400 },
      );
    }
    if (/LimitExceeded/.test(code)) {
      return NextResponse.json(
        { error: "Too many attempts — wait a bit and try again." },
        { status: 429 },
      );
    }
    return NextResponse.json({ error: "Couldn't change the password. Try again." }, { status: 500 });
  }
}
