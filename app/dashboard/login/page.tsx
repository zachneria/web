"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DashboardLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);
  // First-login (invite) NEW_PASSWORD_REQUIRED challenge.
  const [session, setSession] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  // Forgot-password: send a reset code, then confirm code + new password.
  const [forgot, setForgot] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [resetCode, setResetCode] = useState("");

  const submitForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setInfo("");
    if (!codeSent) {
      if (!email.trim()) {
        setErr("Enter your account email first.");
        return;
      }
      setBusy(true);
      try {
        await fetch("/api/auth/forgot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        setCodeSent(true);
        setInfo("If that email has an account, a reset code is on its way.");
      } catch {
        setErr("Couldn't send the code. Try again.");
      } finally {
        setBusy(false);
      }
      return;
    }
    if (newPassword.length < 8) {
      setErr("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirm) {
      setErr("Passwords don't match.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: resetCode, newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(data.error || "Couldn't reset the password.");
        return;
      }
      // Back to sign-in with the new password ready to use.
      setForgot(false);
      setCodeSent(false);
      setResetCode("");
      setNewPassword("");
      setConfirm("");
      setPassword("");
      setInfo("Password reset — sign in with your new password.");
    } catch {
      setErr("Couldn't reset the password. Try again.");
    } finally {
      setBusy(false);
    }
  };

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
      if (data.challenge === "NEW_PASSWORD_REQUIRED") {
        // Switch to "set your password" for this first-login account.
        setSession(data.session);
        setPassword("");
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

  const submitNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (newPassword.length < 8) {
      setErr("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirm) {
      setErr("Passwords don't match.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/new-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, session, newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(data.error || "Couldn't set your password.");
        // Session expired → send them back to the sign-in form to restart.
        if (/session expired/i.test(data.error || "")) setSession(null);
        return;
      }
      router.replace("/dashboard");
      router.refresh();
    } catch {
      setErr("Couldn't set your password. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#1A1E38",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <form
        onSubmit={session ? submitNewPassword : forgot ? submitForgot : submit}
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
          <span style={{ fontWeight: 800, fontSize: 20, letterSpacing: -0.4, color: "#22243A" }}>shabanga</span>
        </div>

        {session ? (
          <>
            <h1 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 4px", color: "#22243A" }}>Set your password</h1>
            <p style={{ color: "#777", fontSize: 14, margin: "0 0 20px" }}>
              First time in — choose a password for <strong>{email}</strong>.
            </p>

            <label style={labelStyle}>New password</label>
            <input
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(ev) => setNewPassword(ev.target.value)}
              style={inputStyle}
            />
            <label style={labelStyle}>Confirm password</label>
            <input
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(ev) => setConfirm(ev.target.value)}
              style={inputStyle}
            />

            {err ? (
              <p style={{ color: "#C0322B", fontSize: 13, margin: "12px 0 0" }}>{err}</p>
            ) : null}

            <button type="submit" disabled={busy} style={buttonStyle}>
              {busy ? "Saving…" : "Set password & sign in"}
            </button>
          </>
        ) : forgot ? (
          <>
            <h1 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 4px", color: "#22243A" }}>Reset password</h1>
            <p style={{ color: "#777", fontSize: 14, margin: "0 0 20px" }}>
              {codeSent
                ? "Enter the code we emailed you and choose a new password."
                : "We'll email a reset code to your account address."}
            </p>

            <label style={labelStyle}>Email</label>
            <input
              type="email"
              autoCapitalize="none"
              autoComplete="email"
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              style={inputStyle}
              disabled={codeSent}
            />
            {codeSent && (
              <>
                <label style={labelStyle}>Reset code</label>
                <input
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={resetCode}
                  onChange={(ev) => setResetCode(ev.target.value)}
                  style={inputStyle}
                />
                <label style={labelStyle}>New password</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(ev) => setNewPassword(ev.target.value)}
                  style={inputStyle}
                />
                <label style={labelStyle}>Confirm password</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(ev) => setConfirm(ev.target.value)}
                  style={inputStyle}
                />
              </>
            )}

            {err ? (
              <p style={{ color: "#C0322B", fontSize: 13, margin: "12px 0 0" }}>{err}</p>
            ) : null}
            {info ? (
              <p style={{ color: "#0A6B2D", fontSize: 13, margin: "12px 0 0" }}>{info}</p>
            ) : null}

            <button type="submit" disabled={busy} style={buttonStyle}>
              {busy ? "Working…" : codeSent ? "Reset password" : "Send reset code"}
            </button>
            <button
              type="button"
              onClick={() => {
                setForgot(false);
                setCodeSent(false);
                setErr("");
                setInfo("");
              }}
              style={linkButtonStyle}
            >
              Back to sign in
            </button>
          </>
        ) : (
          <>
            <h1 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 4px", color: "#22243A" }}>Sign in</h1>
            <p style={{ color: "#777", fontSize: 14, margin: "0 0 20px" }}>
              Use your shabanga account — promoters &amp; artists.
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
            {info ? (
              <p style={{ color: "#0A6B2D", fontSize: 13, margin: "12px 0 0" }}>{info}</p>
            ) : null}

            <button type="submit" disabled={busy} style={buttonStyle}>
              {busy ? "Signing in…" : "Sign in"}
            </button>
            <button
              type="button"
              onClick={() => {
                setForgot(true);
                setErr("");
                setInfo("");
              }}
              style={linkButtonStyle}
            >
              Forgot password?
            </button>
          </>
        )}
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
  // Explicit — the card is a white island on the dark body; inherited colors
  // washed out the headings and would make typed text white-on-white.
  color: "#22243A",
  background: "#fff",
};
const buttonStyle: React.CSSProperties = {
  width: "100%",
  marginTop: 20,
  background: "#F5E642",
  color: "#191D33",
  border: "none",
  borderRadius: 10,
  padding: "13px",
  fontSize: 16,
  fontWeight: 700,
  cursor: "pointer",
};
const linkButtonStyle: React.CSSProperties = {
  width: "100%",
  marginTop: 10,
  background: "none",
  border: "none",
  color: "#666",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  padding: "6px",
};
