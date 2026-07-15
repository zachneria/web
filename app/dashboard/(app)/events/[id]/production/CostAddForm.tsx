"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

// Talent autocomplete hit (mirrors the app's cost-form autocomplete).
interface TalentHit {
  id: string;
  name: string;
  handle: string | null;
  city: string | null;
  payeeApp: string | null;
  payeeHandle: string | null;
}

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
  // Talent autocomplete: typing a payee name searches registered (discoverable)
  // artists; picking one links the cost (talentId) + autofills payout info.
  const [talentId, setTalentId] = useState<string | null>(null);
  const [talentName, setTalentName] = useState("");
  const [hits, setHits] = useState<TalentHit[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onPayeeNameChange = (text: string) => {
    setPayeeName(text);
    if (talentId && text !== talentName) {
      setTalentId(null);
      setTalentName("");
    }
    if (timer.current) clearTimeout(timer.current);
    const q = text.trim();
    if (q.length < 2) {
      setHits([]);
      return;
    }
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/dashboard/talent-search?q=${encodeURIComponent(q)}`);
        const d = await res.json().catch(() => ({}));
        setHits(d.results ?? []);
      } catch {
        setHits([]); // best-effort — free text always works
      }
    }, 300);
  };

  const pickTalent = (t: TalentHit) => {
    setTalentId(t.id);
    setTalentName(t.name);
    setPayeeName(t.name);
    setHits([]);
    if (t.payeeApp) setPayeeApp(t.payeeApp);
    if (t.payeeHandle) setPayeeHandle(t.payeeHandle);
  };
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
          talentId: talentId || undefined,
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
      setTalentId(null);
      setTalentName("");
      setHits([]);
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
            <option key={c.value} value={c.value} style={{ background: "#FAFAFA" }}>
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
        <div style={{ flex: 1, position: "relative" }}>
          <input
            style={{ ...input }}
            placeholder="Payee name (optional)"
            value={payeeName}
            onChange={(e) => onPayeeNameChange(e.target.value)}
          />
          {hits.length > 0 && !talentId ? (
            <div style={talentDropdown}>
              {hits.map((t) => (
                <button key={t.id} type="button" style={talentHit} onClick={() => pickTalent(t)}>
                  <span style={talentDot} />
                  <span style={{ flex: 1, textAlign: "left" }}>
                    <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#22243A" }}>
                      {t.name}
                    </span>
                    <span style={{ display: "block", fontSize: 11, color: "#B08CC9" }}>
                      {[t.handle ? `/a/${t.handle}` : null, t.city].filter(Boolean).join(" · ") ||
                        "Registered artist"}
                    </span>
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: "#AF52DE" }}>Link</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <select style={{ ...input, flex: 1 }} value={payeeApp} onChange={(e) => setPayeeApp(e.target.value)}>
          {APPS.map((a) => (
            <option key={a.value} value={a.value} style={{ background: "#FAFAFA" }}>
              {a.label}
            </option>
          ))}
        </select>
      </div>
      {talentId ? (
        <div style={talentLinked}>
          <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: "#D9C2F0" }}>
            ♪ Linked to {talentName} — shows on their artist page
          </span>
          <button
            type="button"
            onClick={() => {
              setTalentId(null);
              setTalentName("");
            }}
            style={{ background: "none", border: "none", color: "#AF52DE", fontSize: 12, fontWeight: 800, cursor: "pointer" }}
          >
            Unlink
          </button>
        </div>
      ) : null}
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
  // render the SAME height side-by-side (selects otherwise cap shorter).
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
  background: "#0FA7B5",
  color: "#191D33",
  border: "none",
  borderRadius: 10,
  padding: "12px",
  fontSize: 15,
  fontWeight: 700,
  cursor: "pointer",
};
// Talent autocomplete (purple = the talent accent, on the dark dashboard).
const talentDropdown: React.CSSProperties = {
  position: "absolute",
  top: "calc(100% + 6px)",
  left: 0,
  right: 0,
  zIndex: 20,
  background: "#241B30",
  border: "1.5px solid #AF52DE",
  borderRadius: 12,
  overflow: "hidden",
};
const talentHit: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  width: "100%",
  padding: "9px 12px",
  background: "transparent",
  border: "none",
  borderBottom: "1px solid #33254226",
  cursor: "pointer",
};
const talentDot: React.CSSProperties = {
  width: 8,
  height: 8,
  borderRadius: 4,
  background: "#AF52DE",
  flexShrink: 0,
};
const talentLinked: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  marginTop: 10,
  background: "#231733",
  border: "1px solid #AF52DE55",
  borderRadius: 10,
  padding: "8px 12px",
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
