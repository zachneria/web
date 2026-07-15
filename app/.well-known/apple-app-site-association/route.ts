// Apple App Site Association — lets iOS open shabanga Universal Links in the app.
// Served at https://shabanga.com/.well-known/apple-app-site-association with
// Content-Type application/json (no file extension). appID = TEAM_ID.bundleID.
// Served identically on shabanga.com and fansonly.live (same Vercel app),
// matching the build's associatedDomains for both.
// Paths the app claims: ticket links (/t) + event pages (/e/<slug>, which
// the app forwards to its buy screen). /p stays web-only (no in-app page).
export function GET() {
  const body = {
    applinks: {
      apps: [],
      details: [
        {
          appID: "VWKR8RY44Z.com.zneria.foapp",
          paths: ["/t", "/t/*", "/e/*"],
        },
      ],
    },
  };
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
