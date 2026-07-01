import Link from "next/link";

import { getDashboard, type DashEvent, type DashSummary } from "@/lib/org-api";

export const dynamic = "force-dynamic";

const STATUS: Record<DashEvent["status"], { label: string; fg: string; bg: string }> = {
  published: { label: "Published", fg: "#1B873F", bg: "#E4F6E9" },
  draft: { label: "Draft", fg: "#6B6B6B", bg: "#EEE" },
  cancelled: { label: "Cancelled", fg: "#C0322B", bg: "#FBE6E5" },
};

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const statRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 8,
};
const statVal: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: "#222",
  fontVariantNumeric: "tabular-nums",
};

// Per-event sales stats — mirrors the app's My Events card (sold/remaining bar
// with the count on each segment, checked-in line, per-tier list, guests +
// drinks/merch when any).
function EventStats({ s }: { s: DashSummary }) {
  const cap = s.capacity ?? 0;
  const sold = s.sold ?? 0;
  const remaining = Math.max(0, cap - sold);
  const pct = cap > 0 ? Math.round((sold / cap) * 100) : 0;
  const soldShare = cap > 0 ? sold / cap : 0;
  const remainShare = cap > 0 ? remaining / cap : 0;

  return (
    <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div
          style={{
            flex: 1,
            height: 22,
            borderRadius: 6,
            background: "#ECECEC",
            display: "flex",
            overflow: "hidden",
          }}
        >
          {sold > 0 ? (
            <div
              style={{
                flex: sold,
                background: "#1A1A1A",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {soldShare >= 0.16 ? (
                <span style={{ color: "#fff", fontSize: 12, fontWeight: 800 }}>{sold}</span>
              ) : null}
            </div>
          ) : null}
          {remaining > 0 ? (
            <div
              style={{
                flex: remaining,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {remainShare >= 0.16 ? (
                <span style={{ color: "#555", fontSize: 12, fontWeight: 800 }}>{remaining}</span>
              ) : null}
            </div>
          ) : null}
        </div>
        <span style={{ width: 44, textAlign: "right", fontSize: 14, fontWeight: 800, color: "#000" }}>
          {pct}%
        </span>
      </div>

      <div style={{ fontSize: 12, color: "#999" }}>
        {s.checkedIn ?? 0}/{cap} checked in
      </div>

      {s.tiers && s.tiers.length > 0 ? (
        <div style={{ marginTop: 4, display: "flex", flexDirection: "column", gap: 3 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#AAA", letterSpacing: 0.5 }}>
            TICKETS
          </div>
          {s.tiers.map((t, i) => {
            const out = t.quantity > 0 && t.sold >= t.quantity;
            return (
              <div key={`${t.name}-${i}`} style={statRow}>
                <span
                  style={{
                    fontSize: 13,
                    color: "#444",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {t.name}
                </span>
                <span style={statVal}>
                  {t.sold} / {t.quantity}
                  {out ? "  ✓" : ""}
                </span>
              </div>
            );
          })}
        </div>
      ) : null}

      <div style={statRow}>
        <span style={{ fontSize: 13, color: "#444" }}>Guests</span>
        <span style={statVal}>{s.guests ?? 0}</span>
      </div>
      {typeof s.drinks === "number" && s.drinks > 0 ? (
        <div style={statRow}>
          <span style={{ fontSize: 13, color: "#444" }}>Drinks</span>
          <span style={statVal}>{s.drinks}</span>
        </div>
      ) : null}
      {typeof s.merch === "number" && s.merch > 0 ? (
        <div style={statRow}>
          <span style={{ fontSize: 13, color: "#444" }}>Merch</span>
          <span style={statVal}>{s.merch}</span>
        </div>
      ) : null}
    </div>
  );
}

export default async function DashboardEvents() {
  const { events, summary } = await getDashboard();
  const sorted = [...events].sort(
    (a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime(),
  );

  return (
    <>
      <Link href="/dashboard" style={{ color: "#161616", fontWeight: 700, fontSize: 14 }}>
        ← Dashboard
      </Link>
      <h1 style={{ fontSize: 26, fontWeight: 800, margin: "12px 0 4px", color: "#111" }}>
        Your events
      </h1>
      <p style={{ color: "#777", margin: "0 0 24px", fontSize: 15 }}>Sales at a glance.</p>

      {sorted.length === 0 ? (
        <div
          style={{
            background: "#fff",
            border: "1px solid #eee",
            borderRadius: 14,
            padding: 32,
            textAlign: "center",
            color: "#888",
          }}
        >
          No events yet — create one in the fansonly app.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {sorted.map((e) => {
            const s = summary[e.id] || {};
            const pill = STATUS[e.status] || STATUS.draft;
            return (
              <div
                key={e.id}
                style={{
                  background: "#fff",
                  border: "1px solid #eee",
                  borderRadius: 14,
                  padding: 16,
                  display: "flex",
                  gap: 14,
                  alignItems: "flex-start",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={e.flyerUrl || "/logo.png"}
                  alt=""
                  width={56}
                  height={56}
                  style={{ borderRadius: 10, objectFit: "cover", background: "#f2f2f2", flexShrink: 0 }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: "#111",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {e.name}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: pill.fg,
                        background: pill.bg,
                        borderRadius: 999,
                        padding: "2px 8px",
                        flexShrink: 0,
                      }}
                    >
                      {pill.label}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: "#777", marginTop: 2 }}>
                    {fmtDate(e.eventDate)} · {e.venueName}
                  </div>
                  {typeof s.sold === "number" ? <EventStats s={s} /> : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
