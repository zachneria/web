"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const CATEGORIES = [
  { value: "admission", label: "Admission" },
  { value: "drink", label: "Drink" },
  { value: "merch", label: "Merch" },
  { value: "credits", label: "Credits" },
];

export function AddTicketForm({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("admission");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [absorbFee, setAbsorbFee] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const isAdmission = category === "admission";

  const reset = () => {
    setName("");
    setPrice("");
    setQuantity("");
    setAbsorbFee(false);
  };

  const save = async () => {
    setErr("");
    if (!name.trim()) return setErr("Enter a name.");
    const p = parseFloat(price);
    if (isNaN(p) || p < 0) return setErr("Enter a price (0 is fine).");
    const q = parseInt(quantity, 10);
    if (!Number.isFinite(q) || q <= 0) return setErr("Enter a quantity.");
    setSaving(true);
    try {
      const res = await fetch(`/api/dashboard/api/events/${eventId}/ticket-types`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          category,
          price: p,
          quantity: q,
          absorbFee: isAdmission ? absorbFee : false,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setErr(d.error || "Couldn't add the ticket type.");
        return;
      }
      reset();
      setOpen(false);
      router.refresh();
    } catch {
      setErr("Couldn't add the ticket type.");
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} style={addBtn}>
        + Add ticket type
      </button>
    );
  }

  return (
    <div style={cardStyle}>
      <input style={input} placeholder="Name (e.g. Early Bird)" value={name} onChange={(e) => setName(e.target.value)} />
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <select style={{ ...input, flex: 1 }} value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value} style={{ background: "#1E1E1E" }}>
              {c.label}
            </option>
          ))}
        </select>
        <input
          style={{ ...input, flex: 1 }}
          inputMode="decimal"
          placeholder="Price ($)"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
        <input
          style={{ ...input, flex: 1 }}
          inputMode="numeric"
          placeholder="Qty"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value.replace(/[^0-9]/g, ""))}
        />
      </div>
      {isAdmission ? (
        <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, color: "#D8D8D8", fontSize: 14 }}>
          <input type="checkbox" checked={absorbFee} onChange={(e) => setAbsorbFee(e.target.checked)} style={{ accentColor: "#F5E642" }} />
          I&apos;ll cover the booking fee (buyers pay the listed price)
        </label>
      ) : null}
      {err ? <p style={{ color: "#C0322B", fontSize: 13, margin: "10px 0 0" }}>{err}</p> : null}
      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <button onClick={save} disabled={saving} style={{ ...addBtn, marginTop: 0, flex: 1 }}>
          {saving ? "Adding…" : "Add"}
        </button>
        <button
          onClick={() => {
            setOpen(false);
            setErr("");
          }}
          style={cancelBtn}
        >
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
