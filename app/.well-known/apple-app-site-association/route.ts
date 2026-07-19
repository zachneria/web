// Apple App Site Association — lets iOS open shabanga Universal Links in the app.
// Served at https://shabanga.com/.well-known/apple-app-site-association with
// Content-Type application/json (no file extension). appID = TEAM_ID.bundleID.
// Served identically on shabanga.com and fansonly.live (same Vercel app),
// matching the build's associatedDomains for both.
// Paths the app claims: ticket links (/t) + event pages (/e/<slug>, forwarded
// to the buy screen) + the bar queue (/bar → the native staff screen; opens in
// the browser when the app isn't installed). /p stays web-only.
export function GET() {
  const body = {
    applinks: {
      apps: [],
      details: [
        {
          // New identity (identity rename 2026-07-16 — see fo-app/IDENTITY-RENAME.md).
          appID: "VWKR8RY44Z.com.shabanga.app",
          paths: ["/t", "/t/*", "/e/*", "/bar"],
        },
        {
          // Legacy identity — keep while com.zneria.foapp installs exist.
          appID: "VWKR8RY44Z.com.zneria.foapp",
          paths: ["/t", "/t/*", "/e/*", "/bar"],
        },
      ],
    },
  };
  // webcredentials (passkeys, backlog #32) rides the same file when needed.
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
