import { NextRequest, NextResponse } from "next/server";

import { cognitoRefresh, ID_COOKIE, ID_MAX_AGE, RT_COOKIE } from "@/lib/org-auth";

// Guards /dashboard. If the short-lived id token cookie has expired but a
// refresh token is present, silently mint a new id token (≈30-day sessions);
// otherwise bounce to the login page. The login page itself is always allowed.
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === "/dashboard/login") return NextResponse.next();

  if (req.cookies.get(ID_COOKIE)) return NextResponse.next();

  const rt = req.cookies.get(RT_COOKIE)?.value;
  if (rt) {
    const idToken = await cognitoRefresh(rt);
    if (idToken) {
      const res = NextResponse.next();
      res.cookies.set(ID_COOKIE, idToken, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: ID_MAX_AGE,
      });
      return res;
    }
  }

  const url = req.nextUrl.clone();
  url.pathname = "/dashboard/login";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
