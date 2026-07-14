"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const CATEGORIES = [
  { value: "admission", label: "Admission" },
  { value: "drink", label: "Drink" },
  { value: "merch", label: "Merch" },
  { value: "credits", label: "Credits" },
  { value: "other", label: "Other" },
];
const CHOOSE = "Choose Your Adventure";
// Preset admission names (matches the app). "Custom" → free-text name.
const ADMISSION_NAMES = [CHOOSE, "Early Bird", "General", "Tier 1", "Tier 2", "Tier 3", "Custom"];

type Opt = { label: string; price: string };
const DEFAULT_OPTS: Opt[] = [
  { label: "Community", price: "" },
  { label: "Standard", price: "" },
  { label: "Supporter", price: "" },
];

export function AddTicketForm({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("admission");
  const [namePreset, setNamePreset] = useState("General"); // admission only
  const [name, setName] = useState(""); // free text (non-admission, or admission "Custom")
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [absorbFee, setAbsorbFee] = useState(false);
  const [options, setOptions] = useState<Opt[]>(DEFAULT_OPTS);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const isAdmission = category === "admission";
  const chooseMode = isAdmission && namePreset === CHOOSE;
  const usesFreeName = !isAdmission || namePreset === "Custom";
  const effectiveName = () => (usesFreeName ? name.trim() : namePreset);

  const setOpt = (i: number, patch: Partial<Opt>) =>
    setOptions((prev) => prev.map((o, j) => (j === i ? { ...o, ...patch } : o)));

  const save = async () => {
    setErr("");
    if (!effectiveName()) return setErr("Enter a name.");
    const q = parseInt(quantity, 10);
    if (!Number.isFinite(q) || q <= 0) return setErr("Enter a quantity.");

    const body: Record<string, unknown> = {
      name: effectiveName(),
      category,
      quantity: q,
      absorbFee: isAdmission ? absorbFee : false,
    };

    if (chooseMode) {
      const priceOptions = options
        .filter((o) => o.price.trim() !== "")
        .map((o) => ({ label: o.label.trim() || null, price: parseFloat(o.price) }));
      if (priceOptions.length === 0) return setErr("Add at least one price option.");
      if (priceOptions.some((o) => isNaN(o.price) || o.price < 0)) return setErr("Enter valid prices.");
      body.priceOptions = priceOptions;
    } else {
      const p = parseFloat(price);
      if (isNaN(p) || p < 0) return setErr("Enter a price (0 is fine).");
      body.price = p;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/dashboard/api/events/${eventId}/ticket-types`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setErr(d.error || "Couldn't add the ticket type.");
        return;
      }
      setName("");
      setPrice("");
      setQuantity("");
      setAbsorbFee(false);
      setOptions(DEFAULT_OPTS);
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
      {/* Category */}
      <select
        style={input}
        value={category}
        onChange={(e) => setCategory(e.target.value)}
      >
        {CATEGORIES.map((c) => (
          <option key={c.value} value={c.value} style={opt}>
            {c.label}
          </option>
        ))}
      </select>

      {/* Name */}
      {isAdmission ? (
        <select
          style={{ ...input, marginTop: 10 }}
          value={namePreset}
          onChange={(e) => setNamePreset(e.target.value)}
        >
          {ADMISSION_NAMES.map((n) => (
            <option key={n} value={n} style={opt}>
              {n === "Custom" ? "Custom name…" : n}
            </option>
          ))}
        </select>
      ) : null}
      {usesFreeName ? (
        <input
          style={{ ...input, marginTop: 10 }}
          placeholder={isAdmission ? "Custom name" : "Name (e.g. Beer, T-Shirt)"}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      ) : null}

      {/* Price(s) + qty */}
      {chooseMode ? (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 12, color: "#8A8A8A", marginBottom: 6 }}>
            Buyers pick one price:
          </div>
          {options.map((o, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input
                style={{ ...input, flex: 2 }}
                placeholder="Label (e.g. Community)"
                value={o.label}
                onChange={(e) => setOpt(i, { label: e.target.value })}
              />
              <input
                style={{ ...input, flex: 1 }}
                inputMode="decimal"
                placeholder="$"
                value={o.price}
                onChange={(e) => setOpt(i, { price: e.target.value })}
              />
            </div>
          ))}
          {options.length < 6 ? (
            <button
              onClick={() => setOptions((p) => [...p, { label: "", price: "" }])}
              style={{ ...cancelBtn, padding: "8px 14px", fontSize: 13 }}
            >
              + Add option
            </button>
          ) : null}
          <input
            style={{ ...input, marginTop: 10 }}
            inputMode="numeric"
            placeholder="Quantity"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value.replace(/[^0-9]/g, ""))}
          />
        </div>
      ) : (
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
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
            placeholder="Quantity"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value.replace(/[^0-9]/g, ""))}
          />
        </div>
      )}

      {isAdmission ? (
        <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, color: "#333333", fontSize: 14 }}>
          <input type="checkbox" checked={absorbFee} onChange={(e) => setAbsorbFee(e.target.checked)} style={{ accentColor: "#F5E642" }} />
          I&apos;ll cover the booking fee (buyers pay face value)
        </label>
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
  // render the SAME height (selects otherwise cap shorter than an input).
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
  background: "#F5E642",
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
