"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// Request Payout on web — mirrors the app's flow: fires the Stripe transfer
// via POST /payouts/events/:id/request (idempotency-keyed server-side, so a
// double-click can't double-pay). Server is the real gate (event over,
// payouts connected); the disabled state here is a courtesy.
export function RequestPayout({
  id,
  eventOver,
  existing,
  deposit,
}: {
  id: string;
  eventOver: boolean;
  existing: { status: string; netPayout: string } | null;
  deposit: number | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const money = (n: number) => `$${Number(n).toFixed(2)}`;

  if (existing) {
    return (
      <div
        style={{
          background: "#E4F6E9",
          color: "#1A7A3A",
          borderRadius: 12,
          padding: "13px 16px",
          fontWeight: 700,
          fontSize: 14,
        }}
      >
        {existing.status === "pending"
          ? `${money(Number(existing.netPayout))} sent — typically lands in your bank within 2 business days`
          : `Deposit ${existing.status} — ${money(Number(existing.netPayout))}`}
      </div>
    );
  }

  const request = async () => {
    // Real money moves on this click — always confirm, with the amount.
    if (
      !window.confirm(
        deposit != null
          ? `Request payout? ${money(deposit)} will be transferred to your connected bank account.`
          : "Request payout? Your payout will be transferred to your connected bank account.",
      )
    )
      return;
    setBusy(true);
    setErr("");
    try {
      const res = await fetch(`/api/dashboard/api/payouts/events/${id}/request`, {
        method: "POST",
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(d.error || "Couldn't request the payout. Try again.");
        setBusy(false);
        return;
      }
      router.refresh();
    } catch {
      setErr("Couldn't request the payout. Try again.");
      setBusy(false);
    }
  };

  return (
    <div>
      <button
        onClick={request}
        disabled={!eventOver || busy}
        style={{
          width: "100%",
          padding: "13px",
          borderRadius: 12,
          fontSize: 16,
          fontWeight: 800,
          border: "none",
          cursor: eventOver ? "pointer" : "default",
          background: eventOver ? "#0FA7B5" : "#EFEFEC",
          color: eventOver ? "#161616" : "#9A9A9A",
        }}
      >
        {busy ? "Requesting…" : "Request Payout"}
      </button>
      {!eventOver ? (
        <p style={{ color: "#8A8A8A", fontSize: 13, marginTop: 8 }}>
          Available after the event ends.
        </p>
      ) : null}
      {err ? <p style={{ color: "#C0322B", fontSize: 13, marginTop: 8 }}>{err}</p> : null}
    </div>
  );
}
