"use client";

import { useState } from "react";

// Logged-in password change — POSTs to /api/dashboard/change-password, which
// mints an access token from the httpOnly refresh cookie server-side. The
// current password is required so a walk-up on an open laptop can't hijack.
export function ChangePassword() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (next.length < 8) {
      setMsg({ ok: false, text: "New password needs at least 8 characters." });
      return;
    }
    if (next !== confirm) {
      setMsg({ ok: false, text: "Passwords don't match." });
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/dashboard/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg({ ok: false, text: d.error || "Couldn't change the password." });
        return;
      }
      setCurrent("");
      setNext("");
      setConfirm("");
      setOpen(false);
      setMsg({ ok: true, text: "Password changed." });
    } catch {
      setMsg({ ok: false, text: "Couldn't change the password. Try again." });
    } finally {
      setBusy(false);
    }
  };

  const input: React.CSSProperties = {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #E5E5E5",
    borderRadius: 10,
    padding: "10px 12px",
    fontSize: 14,
    color: "#22243A",
    background: "#fff",
    marginTop: 8,
  };

  return (
    <div>
      {!open ? (
        <button
          onClick={() => {
            setOpen(true);
            setMsg(null);
          }}
          style={{
            background: "none",
            border: "1px solid #E5E5E5",
            borderRadius: 10,
            padding: "9px 16px",
            fontSize: 14,
            fontWeight: 600,
            color: "#22243A",
            cursor: "pointer",
          }}
        >
          Change password
        </button>
      ) : (
        <form onSubmit={save}>
          <input
            type="password"
            autoComplete="current-password"
            placeholder="Current password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            style={input}
          />
          <input
            type="password"
            autoComplete="new-password"
            placeholder="New password (8+ with upper, lower, number)"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            style={input}
          />
          <input
            type="password"
            autoComplete="new-password"
            placeholder="Confirm new password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            style={input}
          />
          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            <button
              type="submit"
              disabled={busy || !current || !next}
              style={{
                background: "#F5E642",
                color: "#191D33",
                border: "none",
                borderRadius: 8,
                padding: "8px 16px",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                opacity: busy || !current || !next ? 0.5 : 1,
              }}
            >
              {busy ? "Saving…" : "Change password"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              style={{
                background: "none",
                border: "none",
                color: "#8A8A8A",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
      {msg ? (
        <p style={{ color: msg.ok ? "#1B873F" : "#C0322B", fontSize: 12, margin: "8px 0 0" }}>
          {msg.text}
        </p>
      ) : null}
    </div>
  );
}
