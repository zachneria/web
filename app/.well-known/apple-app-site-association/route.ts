// Apple App Site Association — lets iOS open shabanga Universal Links in the app.
// Served at https://shabanga.com/.well-known/apple-app-site-association with
// Content-Type application/json (no file extension). appID = TEAM_ID.bundleID.
// Paths the app claims: the ticket link (/t) for now; add /e, /p later.
export function GET() {
  const body = {
    applinks: {
      apps: [],
      details: [
        {
          appID: "VWKR8RY44Z.com.zneria.foapp",
          paths: ["/t", "/t/*"],
        },
      ],
    },
  };
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
