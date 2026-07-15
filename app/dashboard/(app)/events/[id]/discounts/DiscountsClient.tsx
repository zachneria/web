"use client";

import { useCallback, useEffect, useState } from "react";

interface Code {
  id: string;
  code: string;
  batchLabel: string | null;
  kind: "shared" | "unique";
  discountType: "percent" | "fixed";
  value: string;
  maxRedemptions: number | null;
  perEmailLimit: number | null;
  timesRedeemed: number;
  expiresAt: string | null;
  active: boolean;
}

const base = (eventId: string) => `/api/dashboard/api/events/${eventId}/discount-codes`;
const offLabel = (c: Code) =>
  c.discountType === "percent" ? `${parseFloat(c.value)}% off` : `$${parseFloat(c.value).toFixed(2)} off`;

export function DiscountsClient({ eventId }: { eventId: string }) {
  const [codes, setCodes] = useState<Code[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  const [kind, setKind] = useState<"shared" | "unique">("shared");
  const [discountType, setDiscountType] = useState<"percent" | "fixed">("percent");
  const [value, setValue] = useState("");
  const [code, setCode] = useState("");
  const [maxRedemptions, setMaxRedemptions] = useState("");
  const [perEmailLimit, setPerEmailLimit] = useState("");
  const [count, setCount] = useState("25");
  const [batchLabel, setBatchLabel] = useState("");
  const [expiresDays, setExpiresDays] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch(base(eventId), { cache: "no-store" });
      const data = await res.json().catch(() => []);
      setCodes(Array.isArray(data) ? data : data.codes ?? []);
    } catch {
      /* best-effort */
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    load();
  }, [load]);

  const create = async () => {
    setErr("");
    const v = parseFloat(value);
    if (isNaN(v) || v <= 0) return setErr("Enter a discount amount.");
    if (discountType === "percent" && v > 100) return setErr("Percent can't exceed 100.");
    const days = expiresDays.trim() ? parseInt(expiresDays) : 0;
    const body: Record<string, unknown> = {
      kind,
      discountType,
      value: v,
      expiresAt: days > 0 ? new Date(Date.now() + days * 86400000).toISOString() : undefined,
    };
    if (kind === "shared") {
      if (!code.trim()) return setErr("Enter a code (e.g. LOCALS20).");
      body.code = code.trim();
      body.maxRedemptions = maxRedemptions.trim() ? parseInt(maxRedemptions) : null;
      body.perEmailLimit = perEmailLimit.trim() ? parseInt(perEmailLimit) : null;
    } else {
      body.count = parseInt(count) || 0;
      body.batchLabel = batchLabel.trim() || null;
    }
    setSaving(true);
    try {
      const res = await fetch(base(eventId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setErr(d.error || "Couldn't create the code.");
        return;
      }
      setValue("");
      setCode("");
      setBatchLabel("");
      setExpiresDays("");
      await load();
    } catch {
      setErr("Couldn't create the code.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (c: Code) => {
    if (!window.confirm(`Delete ${c.kind === "unique" ? `batch ${c.batchLabel || ""}` : c.code}?`)) return;
    try {
      await fetch(`${base(eventId)}/${c.id}`, { method: "DELETE" });
      await load();
    } catch {
      /* best-effort */
    }
  };

  return (
    <>
      {/* Create */}
      <div style={cardStyle}>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <Seg on={kind === "shared"} onClick={() => setKind("shared")}>
            Shared code
          </Seg>
          <Seg on={kind === "unique"} onClick={() => setKind("unique")}>
            Unique batch
          </Seg>
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <Seg on={discountType === "percent"} onClick={() => setDiscountType("percent")}>
            % off
          </Seg>
          <Seg on={discountType === "fixed"} onClick={() => setDiscountType("fixed")}>
            $ off
          </Seg>
        </div>
        <Row>
          <input
            style={input}
            inputMode="decimal"
            placeholder={discountType === "percent" ? "20 (%)" : "5 ($)"}
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <input
            style={input}
            placeholder="Expires in N days (optional)"
            inputMode="numeric"
            value={expiresDays}
            onChange={(e) => setExpiresDays(e.target.value.replace(/[^0-9]/g, ""))}
          />
        </Row>
        {kind === "shared" ? (
          <>
            <input
              style={{ ...input, marginTop: 10, textTransform: "uppercase" }}
              placeholder="CODE (e.g. LOCALS20)"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
            />
            <Row>
              <Field label="Total uses">
                <input
                  style={input}
                  placeholder="Unlimited"
                  inputMode="numeric"
                  value={maxRedemptions}
                  onChange={(e) => setMaxRedemptions(e.target.value.replace(/[^0-9]/g, ""))}
                />
              </Field>
              <Field label="Uses per person">
                <input
                  style={input}
                  placeholder="Unlimited"
                  inputMode="numeric"
                  value={perEmailLimit}
                  onChange={(e) => setPerEmailLimit(e.target.value.replace(/[^0-9]/g, ""))}
                />
              </Field>
            </Row>
            <p style={{ fontSize: 12, color: "#8A8A8A", margin: "8px 2px 0", lineHeight: 1.5 }}>
              Total uses caps the code across all buyers — e.g. 50 means the first 50 orders.
              Uses per person limits one buyer (matched by their checkout email). Leave either
              blank for no limit.
            </p>
          </>
        ) : (
          <Row>
            <input
              style={input}
              placeholder="How many codes"
              inputMode="numeric"
              value={count}
              onChange={(e) => setCount(e.target.value.replace(/[^0-9]/g, ""))}
            />
            <input
              style={input}
              placeholder="Batch label (e.g. VIP)"
              value={batchLabel}
              onChange={(e) => setBatchLabel(e.target.value)}
            />
          </Row>
        )}
        {err ? <p style={{ color: "#C0322B", fontSize: 13, margin: "10px 0 0" }}>{err}</p> : null}
        <button onClick={create} disabled={saving} style={btn}>
          {saving ? "Creating…" : kind === "shared" ? "Create code" : "Generate batch"}
        </button>
      </div>

      {/* List */}
      <div style={cardStyle}>
        {loading ? (
          <div style={{ color: "#8A8A8A" }}>Loading…</div>
        ) : codes.length === 0 ? (
          <div style={{ color: "#8A8A8A" }}>No discount codes yet.</div>
        ) : (
          codes.map((c) => (
            <div key={c.id} style={listRow}>
              <div>
                <div style={{ fontWeight: 700, color: "#22243A" }}>
                  {c.kind === "unique" ? `${c.batchLabel || "Batch"} · ${offLabel(c)}` : `${c.code} · ${offLabel(c)}`}
                </div>
                <div style={{ fontSize: 12, color: "#8A8A8A" }}>
                  {c.timesRedeemed}
                  {c.maxRedemptions ? `/${c.maxRedemptions}` : ""} used
                  {c.expiresAt ? ` · expires ${new Date(c.expiresAt).toLocaleDateString()}` : ""}
                </div>
              </div>
              <button onClick={() => remove(c)} style={delBtn}>
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </>
  );
}

function Seg({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: "9px",
        borderRadius: 10,
        fontSize: 14,
        fontWeight: 700,
        cursor: "pointer",
        background: on ? "#B7F34D" : "#FFFFFF",
        color: on ? "#1A1E38" : "#333333",
        border: `1.5px solid ${on ? "#B7F34D" : "#D9D9D9"}`,
      }}
    >
      {children}
    </button>
  );
}
function Row({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "flex", gap: 8, marginTop: 10 }}>{children}</div>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ flex: 1, minWidth: 0 }}>
      <span style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#8A8A8A", marginBottom: 4 }}>
        {label}
      </span>
      {children}
    </label>
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
  border: "none",
  borderRadius: 10,
  padding: "11px 12px",
  fontSize: 15,
  background: "#F4F3EF",
  color: "#22243A",
};
const btn: React.CSSProperties = {
  width: "100%",
  marginTop: 14,
  background: "#B7F34D",
  color: "#191D33",
  border: "none",
  borderRadius: 10,
  padding: "12px",
  fontSize: 15,
  fontWeight: 700,
  cursor: "pointer",
};
const listRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 10,
  padding: "10px 0",
  borderBottom: "1px solid #F1F0EC",
};
const delBtn: React.CSSProperties = {
  background: "#FAFAFA",
  color: "#C0322B",
  border: "1px solid #e6c9c7",
  borderRadius: 8,
  padding: "6px 12px",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
};
