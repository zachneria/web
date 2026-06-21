import type { Metadata } from "next";
import { cookies } from "next/headers";

import { BETA_SCRIPTS } from "@/lib/beta-scripts";
import BetaGate from "./BetaGate";
import Scripts from "./Scripts";

// Unlisted: not linked anywhere + tell crawlers to stay out.
export const metadata: Metadata = {
  title: "Beta Test Scripts — fansonly",
  robots: { index: false, follow: false },
};

export default async function BetaPage() {
  const expected = process.env.BETA_PASSWORD;
  const store = await cookies();
  const authed = !!expected && store.get("beta_auth")?.value === expected;

  if (!authed) return <BetaGate configured={!!expected} />;
  return <Scripts markdown={BETA_SCRIPTS} />;
}
