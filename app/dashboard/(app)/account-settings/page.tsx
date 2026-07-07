import Link from "next/link";

import { getOrgClaims, orgFetch } from "@/lib/org-api";
import { PayoutsConnect } from "./PayoutsConnect";

export const dynamic = "force-dynamic";

const card: React.CSSProperties = {
  background: "#1E1E1E",
  border: "1px solid #2E2E2E",
  borderRadius: 14,
  padding: 18,
  marginBottom: 14,
};
const label: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: "#8F8F8F",
  textTransform: "uppercase",
  letterSpacing: 0.5,
  marginBottom: 8,
};

export default async function AccountSettings({
  searchParams,
}: {
  searchParams: Promise<{ connect?: string }>;
}) {
  const { email } = await getOrgClaims();
  const { connect: justReturned = null } = await searchParams;
  let connect: { connected?: boolean; onboarded?: boolean } | null = null;
  try {
    const r = await orgFetch("/payouts/connect/status");
    if (r.ok) connect = await r.json();
  } catch {
    /* best-effort */
  }

  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      <Link href="/dashboard" style={{ color: "#F5E642", fontWeight: 700, fontSize: 14 }}>
        ← Dashboard
      </Link>
      <h1 style={{ fontSize: 24, fontWeight: 800, margin: "12px 0 18px" }}>Account Settings</h1>

      <div style={card}>
        <div style={label}>Account</div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#8F8F8F" }}>Email</span>
          <span style={{ fontWeight: 600 }}>{email || "—"}</span>
        </div>
      </div>

      <div style={card}>
        <div style={label}>Get Paid</div>
        <PayoutsConnect
          connected={!!connect?.connected}
          onboarded={!!connect?.onboarded}
          justReturned={justReturned}
        />
      </div>
    </div>
  );
}
