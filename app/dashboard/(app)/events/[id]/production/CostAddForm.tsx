"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const CATEGORIES = [
  { value: "artist_dj", label: "Artist / DJ" },
  { value: "equipment", label: "Equipment" },
  { value: "venue", label: "Venue" },
  { value: "promo", label: "Promo" },
  { value: "other", label: "Other" },
];
const APPS = [
  { value: "", label: "Pay app (optional)" },
  { value: "venmo", label: "Venmo" },
  { value: "cashapp", label: "Cash App" },
  { value: "zelle", label: "Zelle" },
  { value: "paypal", label: "PayPal" },
  { value: "other", label: "Other" },
];

export function CostAddForm({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("artist_dj");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [payeeName, setPayeeName] = useState("");
  const [payeeApp, setPayeeApp] = useState("");
  const [payeeHandle, setPayeeHandle] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const save = async () => {
    setErr("");
    if (!description.trim()) return setErr("Enter a description.");
    const a = parseFloat(amount);
    if (isNaN(a) || a <= 0) return setErr("Enter an amount.");
    setSaving(true);
    try {
      const res = await fetch(`/api/dashboard/api/payouts/events/${eventId}/costs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          description: description.trim(),
          amount: a,
          payeeName: payeeName.trim() || undefined,
          payeeApp: payeeApp || undefined,
          payeeHandle: payeeHandle.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setErr(d.error || "Couldn't add the cost.");
        return;
      }
      setDescription("");
      setAmount("");
      setPayeeName("");
      setPayeeApp("");
      setPayeeHandle("");
      setOpen(false);
      router.refresh();
    } catch {
      setErr("Couldn't add the cost.");
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} style={addBtn}>
        + Add cost
      </button>
    );
  }

  return (
    <div style={cardStyle}>
      <div style={{ display: "flex", gap: 8 }}>
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
          placeholder="Amount ($)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>
      <input
        style={{ ...input, marginTop: 10 }}
        placeholder="Description (e.g. DJ Loomiere)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <input
          style={{ ...input, flex: 1 }}
          placeholder="Payee name (optional)"
          value={payeeName}
          onChange={(e) => setPayeeName(e.target.value)}
        />
        <select style={{ ...input, flex: 1 }} value={payeeApp} onChange={(e) => setPayeeApp(e.target.value)}>
          {APPS.map((a) => (
            <option key={a.value} value={a.value} style={{ background: "#1E1E1E" }}>
              {a.label}
            </option>
          ))}
        </select>
      </div>
      {payeeApp ? (
        <input
          style={{ ...input, marginTop: 10 }}
          placeholder={payeeApp === "cashapp" ? "$cashtag" : "@username or phone"}
          value={payeeHandle}
          onChange={(e) => setPayeeHandle(e.target.value)}
        />
      ) : null}
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
  // Fixed height (not vertical padding) so text <input>s and native <select>s
  // render the SAME height side-by-side (selects otherwise cap shorter).
  height: 44,
  border: "1px solid #383838",
  borderRadius: 10,
  padding: "0 12px",
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
