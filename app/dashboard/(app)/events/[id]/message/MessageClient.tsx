"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Announcement {
  subject: string;
  body: string;
  createdAt?: string;
  sentAt?: string;
}

export function MessageClient({
  eventId,
  eventName,
  recipientCount,
  history,
}: {
  eventId: string;
  eventName: string;
  recipientCount: number;
  history: Announcement[];
}) {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [face, setFace] = useState("happy"); // Stub's mood for the email
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState("");

  // Prefill templates (mirrors the app's Message screen).
  const applyTemplate = (kind: "update" | "reminder" | "cancelled") => {
    const n = eventName || "the event";
    if (kind === "update") {
      setSubject(`Update about ${n}`);
      setBody(`Hi! A quick update about ${n}:\n\n`);
      setFace("excited");
    } else if (kind === "reminder") {
      setSubject(`${n} is coming up`);
      setBody(`Just a reminder that ${n} is almost here. See you there!\n\n`);
      setFace("happy");
    } else {
      setSubject(`${n} has been cancelled`);
      setBody(
        `We're sorry to share that ${n} has been cancelled. We apologize for the inconvenience.\n\n`,
      );
      setFace("sad");
    }
  };

  const send = async () => {
    setErr("");
    setSent(false);
    const s = subject.trim();
    const b = body.trim();
    if (!s || !b) return setErr("Add a subject and message first.");
    if (recipientCount === 0) return setErr("No one has tickets to this event yet.");
    if (!window.confirm(`Email this to ${recipientCount} buyer${recipientCount === 1 ? "" : "s"}?`)) return;
    setSending(true);
    try {
      const res = await fetch(`/api/dashboard/api/tickets/events/${eventId}/announce`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: s, body: b, face }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setErr(d.error || "Couldn't send.");
        return;
      }
      setSubject("");
      setBody("");
      setSent(true);
      router.refresh();
    } catch {
      setErr("Couldn't send.");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <div style={card}>
        <div style={{ fontSize: 13, color: "#8A8A8A", marginBottom: 12 }}>
          {recipientCount} recipient{recipientCount === 1 ? "" : "s"}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          {[
            { k: "update", label: "Event updated" },
            { k: "reminder", label: "Reminder" },
            { k: "cancelled", label: "Cancelled" },
          ].map((t) => (
            <button
              key={t.k}
              onClick={() => applyTemplate(t.k as "update" | "reminder" | "cancelled")}
              style={chip}
            >
              {t.label}
            </button>
          ))}
        </div>
        <input
          style={input}
          placeholder="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
        <textarea
          style={{ ...input, minHeight: 140, marginTop: 10, resize: "vertical" }}
          placeholder="Your message to buyers…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        {err ? <p style={{ color: "#C0322B", fontSize: 13, margin: "10px 0 0" }}>{err}</p> : null}
        {sent ? <p style={{ color: "#1B873F", fontSize: 13, fontWeight: 600, margin: "10px 0 0" }}>Sent ✓</p> : null}
        <button onClick={send} disabled={sending} style={btn}>
          {sending ? "Sending…" : `Send to ${recipientCount}`}
        </button>
      </div>

      {history.length > 0 ? (
        <div style={card}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "#8A8A8A",
              textTransform: "uppercase",
              letterSpacing: 0.5,
              marginBottom: 8,
            }}
          >
            Sent
          </div>
          {history.map((a, i) => {
            const when = a.sentAt || a.createdAt;
            return (
              <div key={i} style={{ padding: "8px 0", borderBottom: "1px solid #F1F0EC" }}>
                <div style={{ fontWeight: 700, color: "#161616" }}>{a.subject}</div>
                {when ? (
                  <div style={{ fontSize: 12, color: "#8A8A8A" }}>{new Date(when).toLocaleString()}</div>
                ) : null}
              </div>
            );
          })}
        </div>
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
const input: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  border: "none",
  borderRadius: 10,
  padding: "12px 14px",
  fontSize: 15,
  background: "#F4F3EF",
  color: "#161616",
};
const chip: React.CSSProperties = {
  background: "#F4F3EF",
  color: "#333333",
  border: "none",
  borderRadius: 999,
  padding: "7px 14px",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};
const btn: React.CSSProperties = {
  width: "100%",
  marginTop: 14,
  background: "#0FA7B5",
  color: "#161616",
  border: "none",
  borderRadius: 10,
  padding: "12px",
  fontSize: 15,
  fontWeight: 700,
  cursor: "pointer",
};
