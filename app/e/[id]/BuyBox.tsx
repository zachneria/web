"use client";

import { useState, type CSSProperties } from "react";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { QRCodeSVG } from "qrcode.react";

import { getStripe } from "@/lib/stripe";
import { computeTotals, money, BRAND } from "@/lib/pricing";
import type { BuyTicket, BuyTicketType } from "@/lib/types";

const stripePromise = getStripe();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Server caps any single line at 20 (validateAndPrice); mirror it in the UI.
const MAX_PER_ORDER = 20;

async function pollOrder(token: string): Promise<BuyTicket[]> {
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`/api/order?token=${encodeURIComponent(token)}`);
      if (res.ok) {
        const d = await res.json();
        if (d.tickets?.length) return d.tickets as BuyTicket[];
      }
    } catch {
      /* keep polling */
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  return [];
}

export default function BuyBox({
  eventId,
  tickets,
  fee,
  isFree,
}: {
  eventId: string;
  tickets: BuyTicketType[];
  fee: number;
  isFree?: boolean;
}) {
  const [cart, setCart] = useState<Record<string, number>>({});
  const [chosen, setChosen] = useState<Record<string, number>>({}); // choose-a-price
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"select" | "pay" | "done">("select");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [viewToken, setViewToken] = useState<string | null>(null);
  const [issued, setIssued] = useState<BuyTicket[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [applied, setApplied] = useState<{
    code: string;
    discountType: string;
    value: number;
  } | null>(null);
  const [discount, setDiscount] = useState(0);
  const [applyingCode, setApplyingCode] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);

  const totals = computeTotals(tickets, cart, fee, chosen);
  // Discount comes from the server preview; never below 0 (fee is never discounted).
  const effectiveTotal = Math.max(0, Math.round((totals.total - discount) * 100) / 100);

  // Sequential tiers: fixed admission forms a price-ascending ladder; only the
  // cheapest in-stock tier is buyable (choose-a-price / PWYW are independent).
  const activeFixedTierId =
    tickets
      .filter(
        (t) =>
          t.category === "admission" &&
          !(Array.isArray(t.priceOptions) && t.priceOptions.length) &&
          !t.isPayWhatYouWant,
      )
      .sort((a, b) => parseFloat(a.price) - parseFloat(b.price))
      .find((t) => Math.max(0, t.quantity - (t.sold ?? 0)) > 0)?.id ?? null;
  const canBuy =
    totals.count > 0 && name.trim().length >= 2 && EMAIL_RE.test(email.trim());

  // Any cart edit invalidates an applied code — clear it so totals never lie.
  const clearCode = () => {
    setApplied(null);
    setDiscount(0);
    setCodeError(null);
  };

  const itemsPayload = () =>
    totals.lines.map((l) => ({
      ticketTypeId: l.ticketTypeId,
      quantity: l.quantity,
      ...(l.priced ? { price: l.unit } : {}),
    }));

  const setQty = (id: string, q: number) => {
    // Cap admission tiers at what's left (server still backstops at checkout).
    const t = tickets.find((x) => x.id === id);
    let cap = MAX_PER_ORDER;
    if (t && t.category === "admission") {
      cap = Math.min(cap, Math.max(0, t.quantity - (t.sold ?? 0)));
      if (isFree) cap = Math.min(cap, 2); // RSVP party cap (up to 2)
    }
    q = Math.min(q, cap);
    setCart((c) => ({ ...c, [id]: Math.max(0, q) }));
    clearCode();
  };

  // Choose-a-price: tap a price to select (qty 1); tap the selected one to clear.
  const selectChip = (id: string, price: number) => {
    const isSel = (cart[id] || 0) > 0 && chosen[id] === price;
    if (isSel) {
      setCart((c) => ({ ...c, [id]: 0 }));
      setChosen((ch) => {
        const n = { ...ch };
        delete n[id];
        return n;
      });
    } else {
      setCart((c) => ({ ...c, [id]: 1 }));
      setChosen((ch) => ({ ...ch, [id]: price }));
    }
    clearCode();
  };

  const applyCode = async () => {
    const code = codeInput.trim();
    if (!code) return;
    setApplyingCode(true);
    setCodeError(null);
    try {
      const res = await fetch(`/api/events/${eventId}/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: itemsPayload(),
          discountCode: code,
          buyerEmail: EMAIL_RE.test(email.trim()) ? email.trim().toLowerCase() : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCodeError(data.error || "That code isn’t valid.");
        return;
      }
      if (!data.code || data.discount <= 0) {
        setCodeError("That code doesn’t apply to your cart.");
        return;
      }
      setApplied(data.code);
      setDiscount(data.discount);
    } catch {
      setCodeError("Network error — try again.");
    } finally {
      setApplyingCode(false);
    }
  };

  const removeCode = () => {
    setApplied(null);
    setDiscount(0);
    setCodeInput("");
    setCodeError(null);
  };

  const getTickets = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const body = JSON.stringify({
        buyerName: name.trim(),
        buyerEmail: email.trim().toLowerCase(),
        items: itemsPayload(),
        ...(applied ? { discountCode: applied.code } : {}),
      });

      // Free / RSVP (or a code that zeroes the total) → no Stripe; reserve and
      // show the QR straight away.
      if (isFree || effectiveTotal <= 0) {
        const res = await fetch(`/api/events/${eventId}/order`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Couldn't reserve your spot.");
          return;
        }
        setIssued(data.tickets || []);
        setStep("done");
        return;
      }

      const res = await fetch(`/api/events/${eventId}/intent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Couldn't start checkout.");
        return;
      }
      setClientSecret(data.clientSecret);
      setViewToken(data.viewToken);
      setStep("pay");
    } catch {
      setError("Network error — try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (step === "done") return <Success tickets={issued} email={email} />;

  if (step === "pay" && clientSecret) {
    return (
      <Elements
        stripe={stripePromise}
        options={{ clientSecret, appearance: { theme: "stripe" } }}
      >
        <PaymentForm
          viewToken={viewToken!}
          onPaid={(t) => {
            setIssued(t);
            setStep("done");
          }}
        />
      </Elements>
    );
  }

  if (tickets.length === 0) {
    return <p style={styles.soldout}>Tickets aren’t available for this event.</p>;
  }

  return (
    <div style={styles.box}>
      {tickets.map((t) => {
        const opts = Array.isArray(t.priceOptions) ? t.priceOptions : null;
        const isAdm = t.category === "admission";
        const isChoose = !!(opts && opts.length);
        const remaining = isAdm ? Math.max(0, t.quantity - (t.sold ?? 0)) : Infinity;
        const soldOut = isAdm && remaining <= 0;
        const lowStock = isAdm && remaining > 0 && remaining <= 10;
        const cap = Math.min(MAX_PER_ORDER, remaining);
        const atMax = (cart[t.id] || 0) >= cap;
        const orderCapped = atMax && !soldOut && !lowStock && cap === MAX_PER_ORDER;
        // Sequential ladder: a fixed admission tier that isn't the active
        // (cheapest in-stock) one is locked until earlier tiers sell out.
        const isLadder = isAdm && !isChoose && !t.isPayWhatYouWant;
        const locked =
          isLadder && !soldOut && activeFixedTierId != null && t.id !== activeFixedTierId;
        if (opts && opts.length) {
          return (
            <div key={t.id} style={styles.chooseRow}>
              <div style={styles.tName}>{t.name}</div>
              <div style={styles.chooseHint}>
                Choose your price · 1 per person
                {!t.absorbFee && fee > 0 ? `  ·  +$${fee} fee` : ""}
              </div>
              {soldOut ? (
                <div style={styles.soldOutNote}>Sold out</div>
              ) : (
                <>
                  <div style={styles.chips}>
                    {opts.map((o, i) => {
                      const sel = (cart[t.id] || 0) > 0 && chosen[t.id] === o.price;
                      return (
                        <button
                          key={`${o.label}-${o.price}-${i}`}
                          onClick={() => selectChip(t.id, o.price)}
                          style={{ ...styles.chip, ...(sel ? styles.chipSel : {}) }}
                        >
                          {o.label ? <span style={styles.chipLabel}>{o.label}</span> : null}
                          <span style={styles.chipPrice}>${o.price.toFixed(0)}</span>
                        </button>
                      );
                    })}
                  </div>
                  {lowStock && <div style={styles.lowStockNote}>Only {remaining} left</div>}
                </>
              )}
            </div>
          );
        }
        return (
          <div key={t.id} style={styles.row}>
            <div>
              <div style={styles.tName}>{t.name}</div>
              <div style={styles.tPrice}>
                {money(parseFloat(t.price))}
                {!t.absorbFee && fee > 0 ? (
                  <span style={styles.feeNote}>{`  ·  +$${fee} fee`}</span>
                ) : null}
              </div>
              {soldOut && <div style={styles.soldOutNote}>Sold out</div>}
              {locked && (
                <div style={styles.lowStockNote}>Opens when earlier tiers sell out</div>
              )}
              {!soldOut && !locked && lowStock && (
                <div style={styles.lowStockNote}>Only {remaining} left</div>
              )}
              {orderCapped && (
                <div style={styles.lowStockNote}>Max {MAX_PER_ORDER} per order</div>
              )}
            </div>
            <div style={styles.stepper}>
              <button
                style={styles.stepBtn}
                onClick={() => setQty(t.id, (cart[t.id] || 0) - 1)}
                aria-label={`Remove ${t.name}`}
              >
                −
              </button>
              <span style={styles.qty}>{cart[t.id] || 0}</span>
              <button
                style={{ ...styles.stepBtn, opacity: soldOut || atMax || locked ? 0.4 : 1 }}
                disabled={soldOut || atMax || locked}
                onClick={() => setQty(t.id, (cart[t.id] || 0) + 1)}
                aria-label={`Add ${t.name}`}
              >
                +
              </button>
            </div>
          </div>
        );
      })}

      <input
        style={styles.input}
        placeholder="Full name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoComplete="name"
      />
      <input
        style={styles.input}
        placeholder="Email — tickets are sent here"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
        inputMode="email"
      />

      {totals.count > 0 && (
        <>
          {applied ? (
            <div style={styles.codeApplied}>
              <span style={styles.codeAppliedText}>Code {applied.code} applied</span>
              <button style={styles.codeRemove} onClick={removeCode}>
                Remove
              </button>
            </div>
          ) : (
            <div style={styles.codeRow}>
              <input
                style={styles.codeInput}
                placeholder="Have a code?"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                autoCapitalize="characters"
                autoCorrect="off"
              />
              <button
                style={{
                  ...styles.codeApply,
                  opacity: !codeInput.trim() || applyingCode ? 0.5 : 1,
                }}
                disabled={!codeInput.trim() || applyingCode}
                onClick={applyCode}
              >
                {applyingCode ? "…" : "Apply"}
              </button>
            </div>
          )}
          {codeError && <p style={styles.error}>{codeError}</p>}

          <div style={styles.totals}>
            <div style={styles.totRow}>
              <span>Subtotal</span>
              <span>{money(totals.subtotal)}</span>
            </div>
            {discount > 0 && (
              <div style={{ ...styles.totRow, color: "#1A8A34" }}>
                <span>Discount{applied ? ` (${applied.code})` : ""}</span>
                <span>−{money(discount)}</span>
              </div>
            )}
            <div style={styles.totRow}>
              <span>Booking fee</span>
              <span>{money(totals.fee)}</span>
            </div>
            <div style={styles.totRowBold}>
              <span>Total</span>
              <span>{money(effectiveTotal)}</span>
            </div>
          </div>
        </>
      )}

      {error && <p style={styles.error}>{error}</p>}

      <button
        style={{ ...styles.payBtn, opacity: !canBuy || submitting ? 0.5 : 1 }}
        disabled={!canBuy || submitting}
        onClick={getTickets}
      >
        {submitting
          ? "…"
          : isFree
            ? totals.count > 0
              ? `Reserve · ${totals.count} ${totals.count === 1 ? "spot" : "spots"}`
              : "Reserve"
            : totals.count > 0
              ? `Get tickets · ${money(effectiveTotal)}`
              : "Get tickets"}
      </button>
    </div>
  );
}

function PaymentForm({
  viewToken,
  onPaid,
}: {
  viewToken: string;
  onPaid: (tickets: BuyTicket[]) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [paying, setPaying] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const pay = async () => {
    if (!stripe || !elements) return;
    setPaying(true);
    setErr(null);
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.href },
      redirect: "if_required",
    });
    if (error) {
      setErr(error.message || "Payment failed.");
      setPaying(false);
      return;
    }
    // Paid — the webhook issues tickets + emails; poll the order to show QRs.
    const t = await pollOrder(viewToken);
    onPaid(t);
  };

  return (
    <div style={styles.box}>
      <PaymentElement />
      {err && <p style={styles.error}>{err}</p>}
      <button
        style={{ ...styles.payBtn, opacity: paying || !stripe ? 0.6 : 1 }}
        disabled={paying || !stripe}
        onClick={pay}
      >
        {paying ? "Processing…" : "Pay"}
      </button>
    </div>
  );
}

function Success({ tickets, email }: { tickets: BuyTicket[]; email: string }) {
  return (
    <div style={styles.box}>
      <p style={styles.youreIn}>YOU’RE IN</p>
      {tickets.length === 0 ? (
        <p style={styles.muted}>
          Your tickets are on the way — we’ve emailed them to {email}.
        </p>
      ) : (
        tickets.map((t) => (
          <div key={t.id} style={styles.ticketCard}>
            <div style={styles.tName}>{t.ticketTypeName}</div>
            <div style={styles.qrWrap}>
              <QRCodeSVG value={t.qrToken} size={180} />
            </div>
            <div style={styles.holder}>{t.ownerName}</div>
            <div style={styles.hint}>SHOW THIS AT THE DOOR</div>
          </div>
        ))
      )}
      <p style={styles.muted}>
        We also emailed your {tickets.length === 1 ? "ticket" : "tickets"} to {email}.
      </p>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  box: { display: "flex", flexDirection: "column", gap: 14, marginTop: 20 },
  row: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: "#F8F8F8",
    borderRadius: 14,
    padding: 16,
  },
  tName: { fontSize: 16, fontWeight: 700, color: "#000" },
  tPrice: { fontSize: 14, color: "#666", marginTop: 2 },
  feeNote: { color: "#999" },
  lowStockNote: { fontSize: 13, fontWeight: 700, color: "#B25E00", marginTop: 6 },
  soldOutNote: { fontSize: 13, fontWeight: 700, color: "#C0322B", marginTop: 6 },
  stepper: { display: "flex", alignItems: "center", gap: 14 },
  chooseRow: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    background: "#F8F8F8",
    borderRadius: 14,
    padding: 16,
  },
  chooseHint: { fontSize: 13, color: "#888" },
  chips: { display: "flex", gap: 8, flexWrap: "wrap" },
  chip: {
    flex: 1,
    minWidth: 90,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 2,
    border: "1.5px solid #E0E0E0",
    borderRadius: 12,
    background: "#fff",
    padding: "10px 8px",
    cursor: "pointer",
  },
  chipSel: { background: BRAND, borderColor: BRAND },
  chipLabel: { fontSize: 12, fontWeight: 600, color: "#555" },
  chipPrice: { fontSize: 17, fontWeight: 800, color: "#000" },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    border: "1.5px solid #E0E0E0",
    background: "#fff",
    fontSize: 20,
    cursor: "pointer",
    lineHeight: 1,
  },
  qty: { fontSize: 17, fontWeight: 700, minWidth: 16, textAlign: "center" },
  input: {
    border: "1.5px solid #E0E0E0",
    borderRadius: 12,
    padding: "14px 16px",
    fontSize: 16,
    width: "100%",
    boxSizing: "border-box",
  },
  totals: {
    background: "#F8F8F8",
    borderRadius: 14,
    padding: 16,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  totRow: { display: "flex", justifyContent: "space-between", color: "#666", fontSize: 14 },
  totRowBold: {
    display: "flex",
    justifyContent: "space-between",
    fontWeight: 800,
    fontSize: 17,
    color: "#000",
    borderTop: "1px solid #E5E5E5",
    paddingTop: 8,
  },
  payBtn: {
    background: BRAND,
    border: "none",
    borderRadius: 12,
    padding: "16px",
    fontSize: 16,
    fontWeight: 700,
    color: "#000",
    cursor: "pointer",
  },
  soldout: { color: "#666", marginTop: 20 },
  error: { color: "#D70015", fontSize: 14 },
  codeRow: { display: "flex", gap: 8 },
  codeInput: {
    flex: 1,
    border: "1.5px solid #E0E0E0",
    borderRadius: 12,
    padding: "14px 16px",
    fontSize: 16,
    boxSizing: "border-box",
  },
  codeApply: {
    background: BRAND,
    border: "none",
    borderRadius: 12,
    padding: "0 20px",
    fontSize: 15,
    fontWeight: 700,
    color: "#000",
    cursor: "pointer",
  },
  codeApplied: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: "#E4F6E9",
    borderRadius: 12,
    padding: "12px 16px",
  },
  codeAppliedText: { fontSize: 14, fontWeight: 700, color: "#1A8A34" },
  codeRemove: {
    background: "none",
    border: "none",
    color: "#666",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
  youreIn: { fontSize: 13, fontWeight: 700, letterSpacing: 1, color: "#1A8A34" },
  ticketCard: {
    background: "#F8F8F8",
    borderRadius: 16,
    padding: 24,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
  },
  qrWrap: { background: "#fff", padding: 12, borderRadius: 12, border: `3px solid ${BRAND}` },
  holder: { fontSize: 14, color: "#666" },
  hint: { fontSize: 11, fontWeight: 700, letterSpacing: 1, color: "#000" },
  muted: { color: "#666", fontSize: 14, textAlign: "center" },
};
