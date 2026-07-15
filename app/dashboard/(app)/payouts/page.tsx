import Link from "next/link";

import { orgFetch } from "@/lib/org-api";

export const dynamic = "force-dynamic";

// Account-level Payouts hub — the web mirror of the app's (tabs)/payouts.tsx
// (2026-07-14): money is an account concept, not a per-event one. Every
// event's net take in one list; rows drill into the existing per-event
// payouts page (request payout, tips, pay your people). Replaces the Payouts
// tile that used to live in each event's manage grid.

interface Ev {
  id: string;
  name: string;
  eventDate: string;
  status: string;
}

const money = (n: number) =>
  `${n < 0 ? "−" : ""}$${Math.abs(n).toFixed(2)}`;

export default async function PayoutsHub() {
  let events: Ev[] = [];
  const nets: Record<string, number | null> = {};
  const statuses: Record<string, string | null> = {};
  try {
    const [evRes, sumRes] = await Promise.all([
      orgFetch("/events"),
      orgFetch("/payouts/summary"),
    ]);
    if (evRes.ok) events = await evRes.json();
    if (sumRes.ok) {
      const sum = await sumRes.json();
      for (const s of sum?.events ?? []) {
        nets[s.eventId] = s.netPayout;
        statuses[s.eventId] = s.payoutStatus ?? null;
      }
    }
  } catch {
    /* empty state covers failure */
  }

  const rows = events
    .filter((e) => e.status !== "draft")
    .sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime());
  const known = rows
    .map((e) => nets[e.id])
    .filter((n): n is number => typeof n === "number");
  const total = known.reduce((s, n) => s + n, 0);

  return (
    <div style={{ maxWidth: 640 }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, margin: "12px 0 4px" }}>Payouts</h1>
      <p style={{ color: "#8A8A8A", fontSize: 14, margin: "0 0 18px" }}>
        Net take across your events — tap through to request a payout.
      </p>

      <div
        style={{
          background: "#161616",
          borderRadius: 16,
          padding: "22px 20px",
          marginBottom: 18,
        }}
      >
        <div style={{ color: "#9A9A9A", fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>
          Net take, all events
        </div>
        <div style={{ color: total < 0 ? "#FF7052" : "#0FA7B5", fontSize: 34, fontWeight: 800, marginTop: 4 }}>
          {money(total)}
        </div>
      </div>

      {rows.length === 0 ? (
        <p style={{ color: "#8A8A8A", fontSize: 14 }}>
          No published events yet — payouts show up here once you&apos;re selling.
        </p>
      ) : (
        rows.map((e) => {
          const net = nets[e.id];
          const ready =
            !statuses[e.id] &&
            typeof net === "number" &&
            net > 0 &&
            new Date(e.eventDate) <= new Date();
          return (
            <Link
              key={e.id}
              href={`/dashboard/events/${e.id}/payouts`}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                background: "#FAFAFA",
                borderRadius: 14,
                padding: "14px 16px",
                marginBottom: 10,
                textDecoration: "none",
              }}
            >
              <span style={{ minWidth: 0 }}>
                <span style={{ display: "block", fontWeight: 700, color: "#161616", fontSize: 15 }}>
                  {e.name}
                </span>
                <span style={{ display: "block", color: "#8A8A8A", fontSize: 12.5, marginTop: 2 }}>
                  {new Date(e.eventDate).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                  {statuses[e.id] ? (
                    <span style={{ color: "#1A7A3A", fontWeight: 700 }}>
                      {" "}· Deposit {statuses[e.id]}
                    </span>
                  ) : ready ? (
                    <span style={{ color: "#E5484D", fontWeight: 700 }}> · Ready to pay out</span>
                  ) : null}
                </span>
              </span>
              <span style={{ position: "relative", flexShrink: 0 }}>
                <span
                  style={{
                    display: "inline-block",
                    fontWeight: 800,
                    fontSize: 13,
                    borderRadius: 999,
                    padding: "5px 12px",
                    background:
                      typeof net !== "number" ? "#EFEFEC" : net < 0 ? "#FDEDEA" : "#E6F5F6",
                    color:
                      typeof net !== "number" ? "#8A8A8A" : net < 0 ? "#C0322B" : "#0B7285",
                  }}
                >
                  {typeof net !== "number" ? "Custom" : money(net)}
                </span>
                {ready ? (
                  <span
                    style={{
                      position: "absolute",
                      top: -3,
                      right: -3,
                      width: 9,
                      height: 9,
                      borderRadius: "50%",
                      background: "#E5484D",
                      border: "1.5px solid #FAFAFA",
                    }}
                  />
                ) : null}
              </span>
            </Link>
          );
        })
      )}
    </div>
  );
}
