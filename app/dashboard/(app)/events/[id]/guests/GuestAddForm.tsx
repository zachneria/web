"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const CATEGORIES = ["general", "comp", "vip", "talent"];
// Mirrors the app's DRINK_CREDIT_OPTIONS.
const DRINK_CREDITS = ["0", "1", "2", "3", "4", "5", "10", "Unlimited"];

export function GuestAddForm({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [plusOne, setPlusOne] = useState("0");
  const [category, setCategory] = useState("general");
  const [drinkCredits, setDrinkCredits] = useState("0");
  const [notes, setNotes] = useState("");
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
          notes: notes.trim() || undefined,
          plusOne: parseInt(plusOne, 10) || 0,
          category,
          drinkCredits: drinkCredits === "Unlimited" ? null : parseInt(drinkCredits, 10),
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setErr(d.error || "Couldn't add the guest.");
        return;
      }
      setName("");
      setEmail("");
      setNotes("");
      setPlusOne("0");
      setDrinkCredits("0");
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
        <Field label="Type">
          <select style={input} value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c} style={opt}>
                {c[0].toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Plus-ones">
          <input
            style={input}
            inputMode="numeric"
            value={plusOne}
            onChange={(e) => setPlusOne(e.target.value.replace(/[^0-9]/g, "") || "0")}
          />
        </Field>
        <Field label="Drink credits">
          <select style={input} value={drinkCredits} onChange={(e) => setDrinkCredits(e.target.value)}>
            {DRINK_CREDITS.map((d) => (
              <option key={d} value={d} style={opt}>
                {d}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <input
        style={{ ...input, marginTop: 10 }}
        placeholder="Notes (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ flex: 1, minWidth: 0 }}>
      <span style={{ display: "block", fontSize: 11, color: "#8A8A8A", marginBottom: 4 }}>{label}</span>
      {children}
    </label>
  );
}

const opt: React.CSSProperties = { background: "#FAFAFA" };
const cardStyle: React.CSSProperties = {
  background: "#FAFAFA",
  border: "none",
  borderRadius: 14,
  padding: 18,
  marginBottom: 14,
};
const input: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  // Fixed height (not vertical padding) so text <input>s and native <select>s
  // render the SAME height side-by-side — selects otherwise cap shorter than
  // an input, making Plus-ones look taller than Type/Drink credits.
  height: 44,
  border: "none",
  borderRadius: 10,
  padding: "0 12px",
  fontSize: 15,
  background: "#F4F3EF",
  color: "#22243A",
};
const addBtn: React.CSSProperties = {
  width: "100%",
  marginBottom: 14,
  background: "#B7F34D",
  color: "#191D33",
  border: "none",
  borderRadius: 10,
  padding: "12px",
  fontSize: 15,
  fontWeight: 700,
  cursor: "pointer",
};
const cancelBtn: React.CSSProperties = {
  background: "transparent",
  color: "#8A8A8A",
  border: "none",
  borderRadius: 10,
  padding: "12px 18px",
  fontSize: 15,
  fontWeight: 700,
  cursor: "pointer",
};
