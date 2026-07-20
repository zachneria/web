// Apple App Site Association — lets iOS open shabanga Universal Links in the app.
// Served at https://shabanga.com/.well-known/apple-app-site-association with
// Content-Type application/json (no file extension). appID = TEAM_ID.bundleID.
// Served identically on shabanga.com and shabanga.com (same Vercel app),
// matching the build's associatedDomains for both. Legacy com.zneria.foapp
// identity dropped 2026-07-18 — old-bundle installs open links in the browser.
// Paths the app claims: ticket links (/t) + event pages (/e/<slug>, forwarded
// to the buy screen) + the bar queue (/bar → the native staff screen; opens in
// the browser when the app isn't installed). /p stays web-only.
export function GET() {
  const body = {
    applinks: {
      apps: [],
      details: [
        {
          appID: "VWKR8RY44Z.com.shabanga.app",
          paths: ["/t", "/t/*", "/e/*", "/bar", "/scan"],
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
