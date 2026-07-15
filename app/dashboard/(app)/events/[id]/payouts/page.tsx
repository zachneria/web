import Link from "next/link";

import { TipsRail, type Tip } from "../../../TipsRail";
import { EventDetail, card, getJSON, money, row, rowVal } from "../_shared";

import { RequestPayout } from "./RequestPayout";

const PAYOUT_TIPS: Tip[] = [
  {
    key: "after-show",
    title: "Money moves after the show",
    body: "Ticket revenue is held until your event ends — then Request Payout sends it to your bank. Safer for refunds if anything changes.",
  },
  {
    key: "what-you-get",
    title: "What actually transfers",
    body: "Gross ticket sales minus the platform fee (shows under 50 tickets are free), plus tips. Production costs are NOT deducted — you pay your people directly.",
  },
  {
    key: "tips-passthrough",
    title: "Tips pass through to staff",
    body: "Drink tips are collected with orders and added to your transfer in full — never fee'd, earmarked for your staff.",
  },
  {
    key: "connect",
    title: "Connect your bank first",
    body: "Request Payout needs your Stripe payout account connected.",
    href: "/dashboard/account-settings",
    cta: "Check payout status",
  },
];

// Full response of GET /payouts/events/:id — the same data the app screen uses.
interface PayoutDetail {
  event?: { id: string; name: string; eventDate: string; status: string };
  revenue?: { grossRevenue?: number; buyerFeesCollected?: number; totalRevenue?: number };
  revenueByCategory?: { admission?: number; drinks?: number; merch?: number; credits?: number };
  platformFee?: number | "custom";
  platformFeeRate?: string;
  costs?: { id?: string; category?: string; description?: string; amount?: string | number; payeeName?: string | null; payeeApp?: string | null; payeeHandle?: string | null; paid?: boolean }[];
  totalCosts?: number;
  depositAmount?: number | null;
  youKeep?: number | null;
  tipsCollected?: number;
  payout?: { id: string; status: string; netPayout: string } | null;
}

export const dynamic = "force-dynamic";

const CATEGORY_LABELS: [keyof NonNullable<PayoutDetail["revenueByCategory"]>, string][] = [
  ["admission", "Admission"],
  ["drinks", "Drinks"],
  ["merch", "Merch"],
  ["credits", "Credits"],
];

export default async function PayoutsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [event, p] = await Promise.all([
    getJSON<EventDetail>(`/events/${id}`),
    getJSON<PayoutDetail>(`/payouts/events/${id}`),
  ]);

  const gross = p?.revenue?.grossRevenue ?? 0;
  const buyerFees = p?.revenue?.buyerFeesCollected ?? 0;
  const fee = p?.platformFee;
  const tips = p?.tipsCollected ?? 0;
  const totalCosts = p?.totalCosts ?? 0;
  const deposit = p?.depositAmount ?? null;
  const youKeep = p?.youKeep ?? null;
  const costs = p?.costs ?? [];
  const cats = CATEGORY_LABELS.filter(([k]) => (p?.revenueByCategory?.[k] ?? 0) > 0);

  return (
    <div className="dsh-content-row">
      <div className="dsh-content-main" style={{ maxWidth: 640 }}>
        <Link href={`/dashboard/events/${id}`} style={{ color: "#0B8896", fontWeight: 700, fontSize: 14 }}>
          {event?.name ?? "Event"}
        </Link>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: "12px 0 18px", color: "#161616" }}>Payouts</h1>

        {/* Deposit hero — the number that wires */}
        <div
          style={{
            background: "#0FA7B5",
            borderRadius: 16,
            padding: "26px 20px",
            textAlign: "center",
            marginBottom: 16,
          }}
        >
          <div style={{ color: "#0E3A3F", fontSize: 12, fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase" }}>
            Deposit amount
          </div>
          <div style={{ color: "#161616", fontSize: 40, fontWeight: 800, margin: "4px 0 2px" }}>
            {deposit != null ? money(deposit) : "Custom"}
          </div>
          <div style={{ color: "#0E3A3F", fontSize: 14 }}>lands in your account</div>
        </div>

        {/* Breakdown */}
        <div style={card}>
          {cats.map(([k, label]) => (
            <div style={row} key={k}>
              <span style={{ color: "#333333" }}>{label}</span>
              <span style={rowVal}>{money(p?.revenueByCategory?.[k] ?? 0)}</span>
            </div>
          ))}
          <div style={{ ...row, borderTop: cats.length ? "1px solid #F1F0EC" : undefined, marginTop: cats.length ? 6 : 0, paddingTop: cats.length ? 10 : 0 }}>
            <span style={{ fontWeight: 700, color: "#161616" }}>Gross revenue</span>
            <span style={{ ...rowVal, fontWeight: 800 }}>{money(gross)}</span>
          </div>
          <div style={row}>
            <span style={{ color: "#333333" }}>Platform fee{p?.platformFeeRate ? ` (${p.platformFeeRate})` : ""}</span>
            <span style={{ ...rowVal, color: "#C0322B" }}>
              {fee === "custom" ? "Custom" : `− ${money(Number(fee ?? 0))}`}
            </span>
          </div>
          {tips > 0 ? (
            <div style={row}>
              <span style={{ color: "#333333" }}>Tips collected</span>
              <span style={rowVal}>{money(tips)}</span>
            </div>
          ) : null}
          {deposit != null ? (
            <div style={{ ...row, borderTop: "1px solid #F1F0EC", marginTop: 8, paddingTop: 12 }}>
              <span style={{ fontWeight: 700, color: "#161616" }}>Deposit amount</span>
              <span style={{ ...rowVal, fontSize: 18 }}>{money(deposit)}</span>
            </div>
          ) : null}
          <p style={{ color: "#8A8A8A", fontSize: 12.5, lineHeight: 1.6, margin: "10px 2px 0" }}>
            This is exactly what we wire to your account. Buyer fees ({money(buyerFees)}) are the
            platform&apos;s and aren&apos;t included.
          </p>
        </div>

        {/* Settle from the deposit */}
        {(totalCosts > 0 || tips > 0) && youKeep != null ? (
          <div style={card}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#8A8A8A", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>
              Settle from your deposit
            </div>
            {tips > 0 ? (
              <div style={row}>
                <span style={{ color: "#333333" }}>Tips → your staff</span>
                <span style={{ ...rowVal, color: "#C0322B" }}>− {money(tips)}</span>
              </div>
            ) : null}
            {totalCosts > 0 ? (
              <div style={row}>
                <span style={{ color: "#333333" }}>Production → your vendors</span>
                <span style={{ ...rowVal, color: "#C0322B" }}>− {money(totalCosts)}</span>
              </div>
            ) : null}
            <div style={{ ...row, borderTop: "1px solid #F1F0EC", marginTop: 8, paddingTop: 12 }}>
              <span style={{ fontWeight: 700, color: "#161616" }}>You keep</span>
              <span style={{ ...rowVal, fontSize: 18 }}>{money(youKeep)}</span>
            </div>
            <p style={{ color: "#8A8A8A", fontSize: 12.5, lineHeight: 1.6, margin: "10px 2px 0" }}>
              Your deposit includes tips and production money you pass on — after settling both,
              this is your net.
            </p>
          </div>
        ) : null}

        {/* Pay your people (paying happens in the app — Venmo/CashApp are phone gestures) */}
        {costs.length > 0 ? (
          <>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#8A8A8A", letterSpacing: 1, textTransform: "uppercase", margin: "4px 2px 8px" }}>
              Pay your people
            </div>
            {costs.map((c, i) => (
              <div
                key={c.id ?? i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  background: "#FAFAFA",
                  borderRadius: 12,
                  padding: "12px 14px",
                  marginBottom: 8,
                }}
              >
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: "block", fontWeight: 700, color: "#161616", fontSize: 14 }}>
                    {c.payeeName || c.description || "Vendor"}
                  </span>
                  <span style={{ display: "block", color: "#8A8A8A", fontSize: 12.5, marginTop: 2 }}>
                    {[c.category, money(Number(c.amount ?? 0)), c.payeeHandle ? `@${String(c.payeeHandle).replace(/^@/, "")}` : null]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </span>
                <span
                  style={{
                    flexShrink: 0,
                    fontSize: 12,
                    fontWeight: 800,
                    borderRadius: 999,
                    padding: "4px 10px",
                    background: c.paid ? "#E4F6E9" : "#EFEFEC",
                    color: c.paid ? "#1A7A3A" : "#8A8A8A",
                  }}
                >
                  {c.paid ? "Paid ✓" : "Pay in the app"}
                </span>
              </div>
            ))}
          </>
        ) : null}

        <div style={{ marginTop: 14 }}>
          <RequestPayout
            id={id}
            eventOver={!!event && new Date(event.eventDate) <= new Date()}
            existing={p?.payout ?? null}
            deposit={deposit}
          />
        </div>
      </div>
      <TipsRail tips={PAYOUT_TIPS} title="Good to know" />
    </div>
  );
}
