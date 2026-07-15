"use client";

import { useEffect, useState } from "react";

// Editable account name (first + last). Distinct from the public "Promotion
// name" in Promoter Settings — this is the person, that's the brand.
export function AccountName() {
  const [name, setName] = useState("");
  const [saved, setSaved] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/dashboard/profile");
        const d = await res.json().catch(() => ({}));
        setName(d.name ?? "");
        setSaved(d.name ?? "");
      } catch {
        /* leave blank */
      }
    })();
  }, []);

  const save = async () => {
    const n = name.trim();
    if (!n) {
      setMsg({ ok: false, text: "Name can't be empty." });
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/dashboard/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: n }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg({ ok: false, text: d.error || "Couldn't save." });
        return;
      }
      setName(d.name ?? n);
      setSaved(d.name ?? n);
      setMsg({ ok: true, text: "Saved." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ color: "#8A8A8A", flexShrink: 0 }}>Name</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="First and last name"
          style={{
            flex: 1,
            textAlign: "right",
            border: "none",
            outline: "none",
            background: "transparent",
            fontSize: 15,
            fontWeight: 600,
            color: "#22243A",
          }}
        />
        {name.trim() !== saved ? (
          <button
            onClick={save}
            disabled={busy}
            style={{
              background: "#B7F34D",
              color: "#191D33",
              border: "none",
              borderRadius: 8,
              padding: "6px 14px",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {busy ? "…" : "Save"}
          </button>
        ) : null}
      </div>
      {msg ? (
        <p style={{ color: msg.ok ? "#1B873F" : "#C0322B", fontSize: 12, margin: "6px 0 0" }}>
          {msg.text}
        </p>
      ) : null}
    </div>
  );
}
