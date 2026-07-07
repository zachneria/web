"use client";

import { useState } from "react";

// Client control for the "Get Paid" card: starts/continues Stripe Connect
// onboarding from the web (POST /api/dashboard/connect → redirect to Stripe).
// `justReturned` is the ?connect= value when Stripe sends the browser back.
export function PayoutsConnect({
  connected,
  onboarded,
  justReturned,
}: {
  connected: boolean;
  onboarded: boolean;
  justReturned: string | null;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const start = async () => {
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/dashboard/connect", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) {
        setErr(data.error || "Couldn't start payout setup. Try again.");
        setBusy(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setErr("Couldn't start payout setup. Try again.");
      setBusy(false);
    }
  };

  if (connected) {
    return <div style={{ color: "#1B873F", fontWeight: 700 }}>✓ Payouts connected</div>;
  }

  return (
    <div>
      {justReturned === "done" && !onboarded ? (
        <p style={{ color: "#8F8F8F", fontSize: 14, lineHeight: 1.6, margin: "0 0 12px" }}>
          Thanks — Stripe is still verifying your details. This can take a few
          minutes; refresh to check.
        </p>
      ) : (
        <p style={{ color: "#8F8F8F", fontSize: 14, lineHeight: 1.6, margin: "0 0 12px" }}>
          {onboarded
            ? "Almost there — a few more details are needed before payouts turn on."
            : "Connect your bank to receive ticket revenue. Powered by Stripe."}
        </p>
      )}

      <button onClick={start} disabled={busy} style={btn}>
        {busy ? "Opening Stripe…" : onboarded ? "Continue setup" : "Set up payouts"}
      </button>

      {err ? <p style={{ color: "#C0322B", fontSize: 13, marginTop: 10 }}>{err}</p> : null}
    </div>
  );
}

const btn: React.CSSProperties = {
  background: "#F5E642",
  color: "#000",
  border: "none",
  borderRadius: 10,
  padding: "11px 18px",
  fontSize: 15,
  fontWeight: 700,
  cursor: "pointer",
};
