"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// "Discoverable in search" — mirrors the app's event screen toggle (above
// Publish). On = listed in Find Events; off = link-only (hidden from search).
// PUTs `discoverable` to /events/:id via the dashboard proxy.
export function DiscoverableToggle({ id, discoverable }: { id: string; discoverable: boolean }) {
  const router = useRouter();
  const [on, setOn] = useState(discoverable);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const toggle = async () => {
    const next = !on;
    setOn(next); // optimistic
    setBusy(true);
    setErr("");
    try {
      const res = await fetch(`/api/dashboard/api/events/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discoverable: next }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setOn(!next); // revert
        setErr(d.error || "Couldn't update. Try again.");
        return;
      }
      router.refresh();
    } catch {
      setOn(!next); // revert
      setErr("Couldn't update. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <button
        onClick={toggle}
        disabled={busy}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 12,
          background: "#1E1E1E",
          border: "1px solid #2E2E2E",
          borderRadius: 12,
          padding: "14px 16px",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <span style={{ flex: 1 }}>
          <span style={{ display: "block", fontSize: 15, fontWeight: 700, color: "#F2F2F2" }}>
            Discoverable in search
          </span>
          <span
            style={{
              display: "block",
              fontSize: 13,
              // Teal when discoverable, red when hidden — reinforces the state.
              color: on ? "#0FA7B5" : "#C0322B",
              marginTop: 2,
            }}
          >
            {on
              ? "Listed publicly in Find Events"
              : "Not discoverable — link-only, hidden from Find Events"}
          </span>
        </span>
        <span
          style={{
            flexShrink: 0,
            width: 46,
            height: 28,
            borderRadius: 999,
            // Teal (the drink accent) when on — matches the tile hover; grey off.
            background: on ? "#0FA7B5" : "#3A3A3A",
            position: "relative",
            transition: "background 150ms",
          }}
        >
          <span
            style={{
              position: "absolute",
              top: 3,
              left: on ? 21 : 3,
              width: 22,
              height: 22,
              borderRadius: 999,
              // White knob — prominent on the teal track and the grey off-track.
              background: "#FFFFFF",
              transition: "left 150ms, background 150ms",
            }}
          />
        </span>
      </button>
      {err ? <p style={{ color: "#C0322B", fontSize: 13, marginTop: 8 }}>{err}</p> : null}
    </div>
  );
}
