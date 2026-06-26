"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DashboardLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(data.error || "Sign-in failed.");
        return;
      }
      router.replace("/dashboard");
      router.refresh();
    } catch {
      setErr("Couldn't sign in. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#161616",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <form
        onSubmit={submit}
        style={{
          width: "100%",
          maxWidth: 380,
          background: "#fff",
          borderRadius: 16,
          padding: 28,
          boxShadow: "0 10px 40px rgba(0,0,0,0.4)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon.png" alt="" width={32} height={32} style={{ borderRadius: 7 }} />
          <span style={{ fontWeight: 800, fontSize: 20, letterSpacing: -0.4 }}>fansonly</span>
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 4px" }}>Organizer sign in</h1>
        <p style={{ color: "#777", fontSize: 14, margin: "0 0 20px" }}>
          Use your fansonly organizer account.
        </p>

        <label style={labelStyle}>Email</label>
        <input
          type="email"
          autoCapitalize="none"
          autoComplete="email"
          value={email}
          onChange={(ev) => setEmail(ev.target.value)}
          style={inputStyle}
        />
        <label style={labelStyle}>Password</label>
        <input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(ev) => setPassword(ev.target.value)}
          style={inputStyle}
        />

        {err ? (
          <p style={{ color: "#C0322B", fontSize: 13, margin: "12px 0 0" }}>{err}</p>
        ) : null}

        <button type="submit" disabled={busy} style={buttonStyle}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 700,
  color: "#666",
  textTransform: "uppercase",
  letterSpacing: 0.5,
  margin: "12px 0 6px",
};
const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid #ddd",
  borderRadius: 10,
  padding: "12px 14px",
  fontSize: 16,
};
const buttonStyle: React.CSSProperties = {
  width: "100%",
  marginTop: 20,
  background: "#F5E642",
  color: "#000",
  border: "none",
  borderRadius: 10,
  padding: "13px",
  fontSize: 16,
  fontWeight: 700,
  cursor: "pointer",
};
