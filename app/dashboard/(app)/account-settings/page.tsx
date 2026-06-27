import Link from "next/link";

import { getOrgClaims, orgFetch } from "@/lib/org-api";

export const dynamic = "force-dynamic";

const card: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #eee",
  borderRadius: 14,
  padding: 18,
  marginBottom: 14,
};
const label: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: "#999",
  textTransform: "uppercase",
  letterSpacing: 0.5,
  marginBottom: 8,
};

export default async function AccountSettings() {
  const { email } = await getOrgClaims();
  let connect: { connected?: boolean; onboarded?: boolean } | null = null;
  try {
    const r = await orgFetch("/payouts/connect/status");
    if (r.ok) connect = await r.json();
  } catch {
    /* best-effort */
  }

  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      <Link href="/dashboard" style={{ color: "#6C5CE7", fontWeight: 700, fontSize: 14 }}>
        ← Dashboard
      </Link>
      <h1 style={{ fontSize: 24, fontWeight: 800, margin: "12px 0 18px" }}>Account Settings</h1>

      <div style={card}>
        <div style={label}>Account</div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#666" }}>Email</span>
          <span style={{ fontWeight: 600 }}>{email || "—"}</span>
        </div>
      </div>

      <div style={card}>
        <div style={label}>Get Paid</div>
        {connect?.connected ? (
          <div style={{ color: "#1B873F", fontWeight: 700 }}>✓ Payouts connected</div>
        ) : (
          <div style={{ color: "#666", fontSize: 14, lineHeight: 1.6 }}>
            {connect?.onboarded
              ? "Almost there — finish verifying in the fansonly app to receive payouts."
              : "Not connected yet. Connect your bank in the fansonly app to receive ticket revenue."}{" "}
            <span style={{ color: "#999" }}>(Setup on web is coming soon.)</span>
          </div>
        )}
      </div>
    </div>
  );
}
