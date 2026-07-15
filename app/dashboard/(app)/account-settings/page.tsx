import Link from "next/link";

import { getOrgClaims, orgFetch } from "@/lib/org-api";

import { AccountName } from "./AccountName";
import { ChangePassword } from "./ChangePassword";
import { PayoutsConnect } from "./PayoutsConnect";

export const dynamic = "force-dynamic";

const card: React.CSSProperties = {
  background: "#FAFAFA",
  border: "none",
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
  const { email, sub } = await getOrgClaims();
  const { connect: justReturned = null } = await searchParams;
  // The organizer's own plan (self-only fields on GET /users/:id).
  let plan: {
    isPro?: boolean;
    tierName?: string | null;
    tierGuestCap?: number | null;
    platformFeeRate?: number | null;
  } | null = null;
  try {
    if (sub) {
      const r = await orgFetch(`/users/${sub}`);
      if (r.ok) plan = await r.json();
    }
  } catch {
    /* best-effort */
  }
  const feeLine =
    plan?.platformFeeRate === 0
      ? "0% — waived"
      : typeof plan?.platformFeeRate === "number"
        ? `Custom: ${(plan.platformFeeRate * 100).toFixed(1).replace(/\.0$/, "")}%`
        : "Standard sliding scale — free on shows under 50 tickets";
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
        <div style={label}>Your plan</div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ color: "#8A8A8A" }}>Level</span>
          <span style={{ fontWeight: 600 }}>
            {plan?.isPro ? (
              <span
                style={{
                  background: "#B7F34D",
                  color: "#191D33",
                  borderRadius: 99,
                  padding: "2px 10px",
                  fontWeight: 800,
                  fontSize: 13,
                  marginRight: 8,
                }}
              >
                PRO
              </span>
            ) : null}
            {plan?.isPro ? "Pro" : "Standard"}
          </span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ color: "#8A8A8A" }}>Guest passes</span>
          <span style={{ fontWeight: 600 }}>
            {plan?.tierName
              ? `${plan.tierName} — ${plan.tierGuestCap ?? "—"} per event`
              : "—"}
          </span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#8A8A8A" }}>Platform fee</span>
          <span style={{ fontWeight: 600 }}>{feeLine}</span>
        </div>
      </div>

      <div style={card}>
        <div style={label}>Account</div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#8A8A8A" }}>Email</span>
          <span style={{ fontWeight: 600 }}>{email || "—"}</span>
        </div>
        <AccountName />
      </div>

      <div style={card}>
        <div style={label}>Security</div>
        <ChangePassword />
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
