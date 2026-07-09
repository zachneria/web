import Link from "next/link";

import { getOrgClaims, orgFetch } from "@/lib/org-api";

import { AccountName } from "./AccountName";
import { PayoutsConnect } from "./PayoutsConnect";

export const dynamic = "force-dynamic";

const card: React.CSSProperties = {
  background: "#FAFAFA",
  border: "1px solid #E5E5E5",
  borderRadius: 14,
  padding: 18,
  marginBottom: 14,
};
const label: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: "#8A8A8A",
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
    <div style={{ maxWidth: 640 }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, margin: "12px 0 18px" }}>Account Settings</h1>

      <div style={card}>
        <div style={label}>Account</div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#8A8A8A" }}>Email</span>
          <span style={{ fontWeight: 600 }}>{email || "—"}</span>
        </div>
        <AccountName />
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
