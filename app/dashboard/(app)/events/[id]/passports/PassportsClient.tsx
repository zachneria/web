"use client";

import { useState } from "react";

// Gold drink pass config (mirrors the app's Passports screen). Frozen once the
// event starts (`locked`).
export function PassportsClient({
  eventId,
  locked,
  initialEnabled,
  initialThreshold,
}: {
  eventId: string;
  locked: boolean;
  initialEnabled: boolean;
  initialThreshold: string;
}) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [threshold, setThreshold] = useState(initialThreshold);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState("");

  const save = async () => {
    setErr("");
    setSaved(false);
    setSaving(true);
    try {
      const res = await fetch(`/api/dashboard/api/events/${eventId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          drinkTierEnabled: enabled,
          drinkTierThreshold: Math.max(0, parseFloat(threshold) || 0),
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setErr(d.error || "Couldn't save.");
        return;
      }
      setSaved(true);
    } catch {
      setErr("Couldn't save.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {locked ? (
        <div
          style={{
            background: "#F0F0F0",
            borderRadius: 12,
            padding: 14,
            color: "#8A8A8A",
            fontSize: 14,
            marginBottom: 14,
          }}
        >
          🔒 Locked — gold pass rules are set before doors and frozen once your event starts.
        </div>
      ) : null}

      <div style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#161616" }}>Gold drink pass</div>
            <p style={{ color: "#8A8A8A", fontSize: 14, lineHeight: 1.5, margin: "6px 0 0" }}>
              Reward generous tippers. When a guest&apos;s tips at this event reach the amount
              below, their next drink pass turns gold so bar staff can spot them and serve them
              first.
            </p>
          </div>
          <input
            type="checkbox"
            checked={enabled}
            disabled={locked}
            onChange={(e) => setEnabled(e.target.checked)}
            style={{ width: 22, height: 22, accentColor: "#0FA7B5", cursor: locked ? "default" : "pointer" }}
          />
        </div>

        {enabled ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#333333" }}>Tips to reach Gold</span>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                border: "none",
                borderRadius: 10,
                padding: "8px 12px",
                background: locked ? "#ECECEC" : "#FFFFFF",
              }}
            >
              <span style={{ color: "#8A8A8A" }}>$</span>
              <input
                inputMode="numeric"
                value={threshold}
                disabled={locked}
                onChange={(e) => setThreshold(e.target.value.replace(/[^0-9]/g, ""))}
                style={{ width: 60, border: "none", outline: "none", fontSize: 16, background: "transparent", color: "#161616" }}
              />
            </div>
          </div>
        ) : null}
      </div>

      <p style={{ color: "#8A8A8A", fontSize: 13, lineHeight: 1.6, margin: "0 0 14px" }}>
        The tier is based on cumulative tips in actual dollars (not a percentage), so it can&apos;t
        be gamed with a tiny tip on a cheap drink.
      </p>

      {err ? <p style={{ color: "#C0322B", fontSize: 13 }}>{err}</p> : null}
      {saved ? <p style={{ color: "#1B873F", fontSize: 13, fontWeight: 600 }}>Saved ✓</p> : null}

      {!locked ? (
        <button onClick={save} disabled={saving} style={btn}>
          {saving ? "Saving…" : "Save"}
        </button>
      ) : null}
    </>
  );
}

const card: React.CSSProperties = {
  background: "#FAFAFA",
  border: "none",
  borderRadius: 14,
  padding: 18,
  marginBottom: 14,
};
const btn: React.CSSProperties = {
  width: "100%",
  background: "#0FA7B5",
  color: "#161616",
  border: "none",
  borderRadius: 12,
  padding: "13px",
  fontSize: 16,
  fontWeight: 700,
  cursor: "pointer",
};
