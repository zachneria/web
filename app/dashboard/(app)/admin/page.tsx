"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

// Platform settings (AppConfig) — the web mirror of the app's Admin screen.
// Fees are read live by fo-tickets pricing, so saving changes checkout math
// immediately.
export default function AdminSettings() {
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [buyerFee, setBuyerFee] = useState("");
  const [atVenueFee, setAtVenueFee] = useState("");
  const [plusOnesCount, setPlusOnesCount] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/dashboard/api/users/admin/config");
        const d = await res.json().catch(() => ({}));
        if (!res.ok) {
          setLoadError(d.error || "Couldn't load platform settings.");
          return;
        }
        setBuyerFee(String(d.buyerFee ?? ""));
        setAtVenueFee(String(d.atVenueFee ?? ""));
        setPlusOnesCount(!!d.plusOnesCountTowardCap);
      } catch {
        setLoadError("Couldn't load platform settings.");
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const save = async () => {
    setMsg(null);
    const fee = Number(buyerFee);
    if (!Number.isFinite(fee) || fee < 0) {
      setMsg({ ok: false, text: "Buyer fee must be a number ≥ 0." });
      return;
    }
    const venueFee = Number(atVenueFee);
    if (!Number.isFinite(venueFee) || venueFee < 0) {
      setMsg({ ok: false, text: "At-venue fee must be a number ≥ 0." });
      return;
    }
    if (
      !window.confirm(
        `Update fees? Admission orders: $${fee.toFixed(2)} buyer fee per ticket. At-venue orders (drinks, credits, merch): $${venueFee.toFixed(2)} flat. Takes effect immediately.`,
      )
    ) {
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/dashboard/api/users/admin/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyerFee: fee,
          atVenueFee: venueFee,
          plusOnesCountTowardCap: plusOnesCount,
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg({ ok: false, text: d.error || "Couldn't save." });
        return;
      }
      setBuyerFee(String(d.buyerFee ?? fee));
      setAtVenueFee(String(d.atVenueFee ?? venueFee));
      setPlusOnesCount(!!d.plusOnesCountTowardCap);
      setMsg({ ok: true, text: "Saved — live now." });
    } catch {
      setMsg({ ok: false, text: "Couldn't save." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 640 }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, margin: "12px 0 4px" }}>Admin</h1>
      <p style={{ color: "#8A8A8A", fontSize: 14, margin: "0 0 18px" }}>Platform settings</p>

      {!loaded ? (
        <p style={{ color: "#8A8A8A" }}>Loading…</p>
      ) : loadError ? (
        <p style={{ color: "#C0322B" }}>{loadError}</p>
      ) : (
        <>
          <Link href="/dashboard/admin/organizers" style={navRow}>
            <span style={{ fontWeight: 700, color: "#22243A" }}>Organizers, tiers &amp; caps</span>
            <span style={{ color: "#8A8A8A", fontSize: 18 }}>›</span>
          </Link>

          <div style={card}>
            <div style={sectionLabel}>Fees</div>

            <label style={fieldLabel}>Buyer fee (admission, per ticket)</label>
            <div style={feeInputWrap}>
              <span style={{ color: "#8A8A8A", paddingLeft: 12 }}>$</span>
              <input
                value={buyerFee}
                onChange={(e) => setBuyerFee(e.target.value)}
                inputMode="decimal"
                placeholder="0.99"
                style={feeInput}
              />
            </div>

            <label style={fieldLabel}>At-venue fee (drinks, credits, merch — flat per order)</label>
            <div style={feeInputWrap}>
              <span style={{ color: "#8A8A8A", paddingLeft: 12 }}>$</span>
              <input
                value={atVenueFee}
                onChange={(e) => setAtVenueFee(e.target.value)}
                inputMode="decimal"
                placeholder="0.50"
                style={feeInput}
              />
            </div>

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginTop: 16,
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={plusOnesCount}
                onChange={(e) => setPlusOnesCount(e.target.checked)}
                style={{ width: 18, height: 18, accentColor: "#0FA7B5" }}
              />
              <span>
                <span style={{ fontWeight: 600, fontSize: 14, display: "block" }}>
                  Plus-ones count toward the guest cap
                </span>
                <span style={{ fontSize: 12, color: "#8A8A8A" }}>
                  If on, a +2 guest uses 3 of the allotment.
                </span>
              </span>
            </label>

            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16 }}>
              <button onClick={save} disabled={saving} style={btn}>
                {saving ? "Saving…" : "Save changes"}
              </button>
              {msg ? (
                <span style={{ color: msg.ok ? "#1B873F" : "#C0322B", fontSize: 13 }}>
                  {msg.text}
                </span>
              ) : null}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const card: React.CSSProperties = {
  background: "#FAFAFA",
  border: "none",
  borderRadius: 14,
  padding: 18,
  marginBottom: 16,
};
const navRow: React.CSSProperties = {
  ...card,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  textDecoration: "none",
};
const sectionLabel: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: "#8A8A8A",
  textTransform: "uppercase",
  letterSpacing: 0.5,
  marginBottom: 8,
};
const fieldLabel: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  fontWeight: 700,
  color: "#8A8A8A",
  margin: "10px 0 4px",
};
const feeInputWrap: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  border: "none",
  borderRadius: 10,
  background: "#F4F3EF",
};
const feeInput: React.CSSProperties = {
  flex: 1,
  border: "none",
  outline: "none",
  padding: "11px 12px 11px 6px",
  fontSize: 15,
  background: "transparent",
  color: "#22243A",
};
const btn: React.CSSProperties = {
  background: "#F5E642",
  color: "#191D33",
  border: "none",
  borderRadius: 10,
  padding: "10px 18px",
  fontWeight: 700,
  fontSize: 14,
  cursor: "pointer",
};
