"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// Publish / unpublish an event from the web hub (PUT status via the dashboard
// proxy). Cancelled events are terminal — no toggle.
export function PublishToggle({
  id,
  status,
}: {
  id: string;
  status: "draft" | "published" | "cancelled";
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  if (status === "cancelled") {
    return <div style={{ color: "#C0322B", fontWeight: 700, fontSize: 14 }}>Event cancelled</div>;
  }

  const published = status === "published";
  const toggle = async () => {
    const next = published ? "draft" : "published";
    if (
      !window.confirm(
        published
          ? "Unpublish this event? Tickets will stop selling."
          : "Publish this event? It'll be live for buyers.",
      )
    )
      return;
    setBusy(true);
    setErr("");
    try {
      const res = await fetch(`/api/dashboard/api/events/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setErr(d.error || "Couldn't update. Try again.");
        setBusy(false);
        return;
      }
      router.refresh();
    } catch {
      setErr("Couldn't update. Try again.");
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
          padding: "13px",
          borderRadius: 12,
          fontSize: 16,
          fontWeight: 700,
          cursor: "pointer",
          background: published ? "#fff" : "#F5E642",
          color: published ? "#C0322B" : "#000",
          border: published ? "1.5px solid #C0322B" : "none",
        }}
      >
        {busy ? "…" : published ? "Unpublish event" : "Publish event"}
      </button>
      {err ? <p style={{ color: "#C0322B", fontSize: 13, marginTop: 8 }}>{err}</p> : null}
    </div>
  );
}
