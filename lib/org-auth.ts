// Organizer web auth — reuses the existing Cognito organizer accounts (same
// pool as the iOS app). We talk to the Cognito IDP JSON API directly (no SDK /
// no client secret — the organizer app client is public with USER_PASSWORD_AUTH
// + REFRESH_TOKEN_AUTH enabled). Tokens are stored in httpOnly cookies; the
// short-lived id token is auto-refreshed from the long-lived refresh token by
// middleware, so sessions last ~30 days. Server-only (uses no client APIs).

const REGION = process.env.COGNITO_REGION || "us-east-1";
// Public organizer app client (no secret). Override via env if it ever changes.
const CLIENT_ID = process.env.COGNITO_ORG_CLIENT_ID || "60oj1u2fd1fpb6u0diircq3klk";
const IDP = `https://cognito-idp.${REGION}.amazonaws.com/`;

export const ID_COOKIE = "fo_id";
export const RT_COOKIE = "fo_rt";
// id token lives ~1h; expire the cookie a bit early so middleware refreshes it.
export const ID_MAX_AGE = 55 * 60;
export const RT_MAX_AGE = 30 * 24 * 60 * 60;

async function idp(target: string, body: unknown): Promise<any> {
  const res = await fetch(IDP, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-amz-json-1.1",
      "X-Amz-Target": `AWSCognitoIdentityProviderService.${target}`,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data?.message || "Cognito error") as Error & { code?: string };
    err.code = data?.__type || "";
    throw err;
  }
  return data;
}

export interface LoginResult {
  idToken: string;
  refreshToken: string;
  // present instead of tokens when the account must set a new password first;
  // `session` is the opaque handle needed to answer the challenge.
  challenge?: "NEW_PASSWORD_REQUIRED";
  session?: string;
}

export async function cognitoLogin(email: string, password: string): Promise<LoginResult> {
  const data = await idp("InitiateAuth", {
    AuthFlow: "USER_PASSWORD_AUTH",
    ClientId: CLIENT_ID,
    AuthParameters: { USERNAME: email, PASSWORD: password },
  });
  if (data.ChallengeName === "NEW_PASSWORD_REQUIRED") {
    return {
      idToken: "",
      refreshToken: "",
      challenge: "NEW_PASSWORD_REQUIRED",
      session: data.Session,
    };
  }
  const r = data.AuthenticationResult || {};
  return { idToken: r.IdToken, refreshToken: r.RefreshToken };
}

// Answer the first-login NEW_PASSWORD_REQUIRED challenge (invite flow: the
// organizer was created with a temporary password and must set a real one).
// Returns real session tokens on success, same shape as a normal login.
export async function cognitoCompleteNewPassword(
  email: string,
  session: string,
  newPassword: string,
): Promise<{ idToken: string; refreshToken: string }> {
  const data = await idp("RespondToAuthChallenge", {
    ClientId: CLIENT_ID,
    ChallengeName: "NEW_PASSWORD_REQUIRED",
    Session: session,
    ChallengeResponses: { USERNAME: email, NEW_PASSWORD: newPassword },
  });
  const r = data.AuthenticationResult || {};
  if (!r.IdToken || !r.RefreshToken) {
    // A chained challenge (e.g. required attributes) — not expected for this pool.
    const e = new Error("Password set, but sign-in didn't complete.") as Error & {
      code?: string;
    };
    e.code = data.ChallengeName || "UNEXPECTED_CHALLENGE";
    throw e;
  }
  return { idToken: r.IdToken, refreshToken: r.RefreshToken };
}

// Mint a fresh id token from the refresh token. Returns null if it's no longer
// valid (revoked / expired) so the caller can send them back to login.
export async function cognitoRefresh(refreshToken: string): Promise<string | null> {
  try {
    const data = await idp("InitiateAuth", {
      AuthFlow: "REFRESH_TOKEN_AUTH",
      ClientId: CLIENT_ID,
      AuthParameters: { REFRESH_TOKEN: refreshToken },
    });
    return data.AuthenticationResult?.IdToken || null;
  } catch {
    return null;
  }
}

// Logged-in password change. ChangePassword wants an ACCESS token — the
// browser only holds cookies (id + refresh), so mint a fresh access token
// from the refresh token server-side, same pattern as the silent refresh.
// Cognito errors bubble with .code (NotAuthorizedException = wrong current
// password, InvalidPasswordException = policy) for the route to translate.
export async function cognitoChangePassword(
  refreshToken: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const data = await idp("InitiateAuth", {
    AuthFlow: "REFRESH_TOKEN_AUTH",
    ClientId: CLIENT_ID,
    AuthParameters: { REFRESH_TOKEN: refreshToken },
  });
  const accessToken = data.AuthenticationResult?.AccessToken;
  if (!accessToken) {
    const e = new Error("Session expired") as Error & { code?: string };
    e.code = "SESSION_EXPIRED";
    throw e;
  }
  await idp("ChangePassword", {
    AccessToken: accessToken,
    PreviousPassword: currentPassword,
    ProposedPassword: newPassword,
  });
}

// Forgot-password pair (public — same two calls the app's reset flow makes).
export async function cognitoForgotPassword(email: string): Promise<void> {
  await idp("ForgotPassword", { ClientId: CLIENT_ID, Username: email });
}

export async function cognitoConfirmForgotPassword(
  email: string,
  code: string,
  newPassword: string,
): Promise<void> {
  await idp("ConfirmForgotPassword", {
    ClientId: CLIENT_ID,
    Username: email,
    ConfirmationCode: code,
    Password: newPassword,
  });
}
