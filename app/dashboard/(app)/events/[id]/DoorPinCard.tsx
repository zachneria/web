"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// Door PIN card on the event hub. The PIN is generated at event creation
// (fo-events); this is where the organizer reads it and changes it from the
// web. Door staff enter it to scan without an account — so it's meant to be
// shown + shared, not hidden. Writes via the dashboard proxy: PUT /events/:id.
const randomPin = () => String(Math.floor(1000 + Math.random() * 9000));

export function DoorPinCard({ id, doorPin }: { id: string; doorPin: string | null }) {
  const router = useRouter();
  const [pin, setPin] = useState<string | null>(doorPin);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const save = async (next: string) => {
    setBusy(true);
    setErr("");
    try {
      const res = await fetch(`/api/dashboard/api/events/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doorPin: next }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setErr(d.error || "Couldn't update the PIN. Try again.");
        return;
      }
      setPin(next);
      setEditing(false);
      setDraft("");
      router.refresh();
    } catch {
      setErr("Couldn't update the PIN. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const label: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 1,
    color: "#8A8A8A",
    textTransform: "uppercase",
  };
  const btn: React.CSSProperties = {
    border: "1px solid #E2E2E2",
    background: "#fff",
    borderRadius: 10,
    padding: "8px 14px",
    fontSize: 14,
    fontWeight: 700,
    color: "#161616",
    cursor: busy ? "default" : "pointer",
    opacity: busy ? 0.6 : 1,
  };

  return (
    <div style={{ background: "#FAFAFA", borderRadius: 12, padding: "16px 18px" }}>
      <div style={label}>Door PIN</div>

      {editing ? (
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value.replace(/[^0-9]/g, "").slice(0, 8))}
            inputMode="numeric"
            autoFocus
            placeholder="4–8 digits"
            style={{
              width: 140,
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: 4,
              fontFamily: "ui-monospace, Menlo, monospace",
              padding: "8px 12px",
              border: "1px solid #D8D8D8",
              borderRadius: 10,
              color: "#161616",
            }}
          />
          <button
            style={{ ...btn, background: "#0FA7B5", color: "#fff", border: "none" }}
            disabled={busy || draft.length < 4}
            onClick={() => save(draft)}
          >
            Save
          </button>
          <button
            style={btn}
            disabled={busy}
            onClick={() => {
              setEditing(false);
              setDraft("");
              setErr("");
            }}
          >
            Cancel
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 8, flexWrap: "wrap" }}>
          <span
            style={{
              fontSize: 34,
              fontWeight: 800,
              letterSpacing: 6,
              fontFamily: "ui-monospace, Menlo, monospace",
              color: pin ? "#0FA7B5" : "#8A8A8A",
            }}
          >
            {pin || "— — — —"}
          </span>
          <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
            <button
              style={btn}
              disabled={busy}
              onClick={() => {
                setDraft(pin || "");
                setEditing(true);
                setErr("");
              }}
            >
              Change
            </button>
            <button style={btn} disabled={busy} onClick={() => save(randomPin())}>
              Regenerate
            </button>
          </div>
        </div>
      )}

      <p style={{ fontSize: 13, color: "#8A8A8A", margin: "10px 0 0" }}>
        Give this to door staff — they enter it to scan tickets (no app or login
        needed).
      </p>
      {err ? <p style={{ color: "#C0322B", fontSize: 13, margin: "8px 0 0" }}>{err}</p> : null}
    </div>
  );
}
