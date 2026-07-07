"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const CATEGORIES = ["general", "comp", "vip", "talent"];

export function GuestAddForm({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [plusOne, setPlusOne] = useState("0");
  const [category, setCategory] = useState("general");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const save = async () => {
    setErr("");
    if (!name.trim()) return setErr("Enter a name.");
    setSaving(true);
    try {
      const res = await fetch(`/api/dashboard/api/guests/events/${eventId}/guests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim() || undefined,
          plusOne: parseInt(plusOne, 10) || 0,
          category,
          drinkCredits: 0,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setErr(d.error || "Couldn't add the guest.");
        return;
      }
      setName("");
      setEmail("");
      setPlusOne("0");
      setOpen(false);
      router.refresh();
    } catch {
      setErr("Couldn't add the guest.");
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} style={addBtn}>
        + Add guest
      </button>
    );
  }

  return (
    <div style={cardStyle}>
      <input style={input} placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
      <input
        style={{ ...input, marginTop: 10 }}
        placeholder="Email (optional)"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <select style={{ ...input, flex: 1 }} value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c} style={{ background: "#1E1E1E" }}>
              {c[0].toUpperCase() + c.slice(1)}
            </option>
          ))}
        </select>
        <select style={{ ...input, flex: 1 }} value={plusOne} onChange={(e) => setPlusOne(e.target.value)}>
          <option value="0" style={{ background: "#1E1E1E" }}>No plus-ones</option>
          <option value="1" style={{ background: "#1E1E1E" }}>+1</option>
          <option value="2" style={{ background: "#1E1E1E" }}>+2</option>
        </select>
      </div>
      {err ? <p style={{ color: "#C0322B", fontSize: 13, margin: "10px 0 0" }}>{err}</p> : null}
      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <button onClick={save} disabled={saving} style={{ ...addBtn, marginBottom: 0, flex: 1 }}>
          {saving ? "Adding…" : "Add"}
        </button>
        <button onClick={() => { setOpen(false); setErr(""); }} style={cancelBtn}>
          Cancel
        </button>
      </div>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: "#1E1E1E",
  border: "1px solid #2E2E2E",
  borderRadius: 14,
  padding: 18,
  marginBottom: 14,
};
const input: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid #383838",
  borderRadius: 10,
  padding: "11px 12px",
  fontSize: 15,
  background: "#222",
  color: "#F2F2F2",
};
const addBtn: React.CSSProperties = {
  width: "100%",
  marginBottom: 14,
  background: "#F5E642",
  color: "#000",
  border: "none",
  borderRadius: 10,
  padding: "12px",
  fontSize: 15,
  fontWeight: 700,
  cursor: "pointer",
};
const cancelBtn: React.CSSProperties = {
  background: "transparent",
  color: "#8F8F8F",
  border: "1px solid #383838",
  borderRadius: 10,
  padding: "12px 18px",
  fontSize: 15,
  fontWeight: 700,
  cursor: "pointer",
};
