import { getOrgClaims, orgFetch } from "@/lib/org-api";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
const passthrough = async (res: Response) =>
  new Response(await res.text(), { status: res.status, headers: { "Content-Type": "application/json" } });

// POST /api/dashboard/connect — start/continue Stripe Connect onboarding from
// the web dashboard. Returns { url } to the Stripe-hosted onboarding page; the
// backend sets platform:'web' return URLs so Stripe sends the browser back to
// /dashboard/account-settings.
export async function POST() {
  const { sub, email } = await getOrgClaims();
  if (!sub) return json({ error: "Not signed in" }, 401);
  return passthrough(
    await orgFetch("/payouts/connect/onboard", {
      method: "POST",
      body: JSON.stringify({ platform: "web", email }),
    }),
  );
}

// GET /api/dashboard/connect — current payout-account status.
export async function GET() {
  const { sub } = await getOrgClaims();
  if (!sub) return json({ error: "Not signed in" }, 401);
  return passthrough(await orgFetch("/payouts/connect/status"));
}
