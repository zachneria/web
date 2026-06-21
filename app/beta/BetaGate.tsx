"use client";

import { useState, type CSSProperties } from "react";

const BRAND = "#F5E642";

export default function BetaGate({ configured }: { configured: boolean }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!password.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/beta-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: password.trim() }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error || "Wrong access code.");
        return;
      }
      window.location.reload();
    } catch {
      setError("Network error — try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <div style={styles.smiley}>☺</div>
        <h1 style={styles.title}>Beta testers</h1>
        <p style={styles.sub}>Enter the access code you were sent.</p>
        <input
          style={styles.input}
          type="password"
          placeholder="Access code"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          autoFocus
        />
        {error && <p style={styles.error}>{error}</p>}
        {!configured && (
          <p style={styles.error}>
            This page isn’t configured yet (no access code set).
          </p>
        )}
        <button
          style={{ ...styles.btn, opacity: !password.trim() || busy ? 0.5 : 1 }}
          disabled={!password.trim() || busy}
          onClick={submit}
        >
          {busy ? "…" : "Enter"}
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  wrap: {
    minHeight: "100dvh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#161616",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    background: "#fff",
    borderRadius: 18,
    padding: 28,
    display: "flex",
    flexDirection: "column",
    gap: 12,
    textAlign: "center",
  },
  smiley: {
    width: 44,
    height: 44,
    borderRadius: 10,
    background: BRAND,
    color: "#000",
    fontSize: 26,
    lineHeight: "44px",
    margin: "0 auto",
    fontWeight: 700,
  },
  title: { fontSize: 22, fontWeight: 800, margin: 0, color: "#000" },
  sub: { fontSize: 14, color: "#666", margin: 0 },
  input: {
    border: "1.5px solid #E0E0E0",
    borderRadius: 12,
    padding: "14px 16px",
    fontSize: 16,
    width: "100%",
    boxSizing: "border-box",
  },
  error: { color: "#D70015", fontSize: 13, margin: 0 },
  btn: {
    background: BRAND,
    border: "none",
    borderRadius: 12,
    padding: "14px",
    fontSize: 16,
    fontWeight: 700,
    color: "#000",
    cursor: "pointer",
  },
};
