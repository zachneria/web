import Link from "next/link";
import type { IconType } from "react-icons";
import {
  IoCreateOutline,
  IoImageOutline,
  IoLinkOutline,
  IoSparklesOutline,
} from "react-icons/io5";

import { getDashboard, getOrgClaims, orgFetch, type DashEvent, type DashSummary } from "@/lib/org-api";

import { TipsRail, type Tip } from "../TipsRail";

export const dynamic = "force-dynamic";

// Mirrors the app's create chooser (create/index.tsx): describe / link /
// screenshot (coming soon) / scratch. Laid out as a row of tiles.
const CREATE_METHODS: {
  key: string;
  label: string;
  hint: string;
  Icon: IconType;
  href?: string;
}[] = [
  {
    key: "describe",
    label: "Describe your event",
    hint: 'e.g. "Warehouse party July 3, 9pm–3am, 200 people"',
    Icon: IoSparklesOutline,
    href: "/dashboard/events/new?m=describe",
  },
  {
    key: "link",
    label: "Import from a link",
    hint: "Facebook or Partiful event URL",
    Icon: IoLinkOutline,
    href: "/dashboard/events/new?m=link",
  },
  {
    key: "screenshot",
    label: "Import from a screenshot",
    hint: "Flyer or event page screenshot",
    Icon: IoImageOutline,
  },
  {
    key: "scratch",
    label: "Start from scratch",
    hint: "Enter the details manually",
    Icon: IoCreateOutline,
    href: "/dashboard/events/new?m=scratch",
  },
];

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
  color: "#333333",
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
                background: "#F5E642",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {soldShare >= 0.16 ? (
                <span style={{ color: "#000", fontSize: 12, fontWeight: 800 }}>{sold}</span>
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
                <span style={{ color: "#8A8A8A", fontSize: 12, fontWeight: 800 }}>{remaining}</span>
              ) : null}
            </div>
          ) : null}
        </div>
        <span style={{ width: 44, textAlign: "right", fontSize: 14, fontWeight: 800, color: "#111111" }}>
          {pct}%
        </span>
      </div>

      <div style={{ fontSize: 12, color: "#8A8A8A" }}>
        {s.checkedIn ?? 0}/{cap} checked in
      </div>

      {s.tiers && s.tiers.length > 0 ? (
        <div style={{ marginTop: 4, display: "flex", flexDirection: "column", gap: 3 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#8A8A8A", letterSpacing: 0.5 }}>
            TICKETS
          </div>
          {s.tiers.map((t, i) => {
            const out = t.quantity > 0 && t.sold >= t.quantity;
            return (
              <div key={`${t.name}-${i}`} style={statRow}>
                <span
                  style={{
                    fontSize: 13,
                    color: "#333333",
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
        <span style={{ fontSize: 13, color: "#333333" }}>Guests</span>
        <span style={statVal}>{s.guests ?? 0}</span>
      </div>
      {typeof s.drinks === "number" && s.drinks > 0 ? (
        <div style={statRow}>
          <span style={{ fontSize: 13, color: "#333333" }}>Drinks</span>
          <span style={statVal}>{s.drinks}</span>
        </div>
      ) : null}
      {typeof s.merch === "number" && s.merch > 0 ? (
        <div style={statRow}>
          <span style={{ fontSize: 13, color: "#333333" }}>Merch</span>
          <span style={statVal}>{s.merch}</span>
        </div>
      ) : null}
    </div>
  );
}

// Dashboard-level nudges: payouts unconnected, promoter link unclaimed,
// upcoming show still sitting in draft. Best-effort — a failed check just
// means no tip.
async function dashboardTips(events: DashEvent[]): Promise<Tip[]> {
  const tips: Tip[] = [];
  const { sub } = await getOrgClaims();
  const [connectR, profileR] = await Promise.all([
    orgFetch("/payouts/connect/status").catch(() => null),
    sub ? orgFetch(`/users/${sub}`).catch(() => null) : Promise.resolve(null),
  ]);
  try {
    if (connectR?.ok && !(await connectR.json())?.connected) {
      tips.push({
        key: "payouts",
        title: "Set up your payouts",
        body: "Connect your bank through Stripe so ticket money can reach you after the show.",
        href: "/dashboard/account-settings",
        cta: "Connect payouts",
      });
    }
  } catch {}
  try {
    if (profileR?.ok && !(await profileR.json())?.handle) {
      tips.push({
        key: "handle",
        title: "Claim your promoter link",
        body: "shabanga.com/p/your-name — one shareable page with all your shows.",
        href: "/dashboard/promoter-settings",
        cta: "Pick a handle",
      });
    }
  } catch {}
  const draft = events.find(
    (e) => e.status === "draft" && new Date(e.eventDate).getTime() > Date.now(),
  );
  if (draft) {
    tips.push({
      key: "draft",
      title: `“${draft.name}” is still a draft`,
      body: "Buyers can't see it until you publish.",
      href: `/dashboard/events/${draft.id}`,
      cta: "Open it",
    });
  }
  return tips;
}

export default async function DashboardEvents() {
  const { events, summary } = await getDashboard();
  const tips = await dashboardTips(events);
  // Mirror the app: upcoming soonest-first, past events grouped at the bottom
  // (most recent past first). Descending-only buried the nearest shows.
  const now = Date.now();
  const isPast = (e: (typeof events)[number]) => new Date(e.eventDate).getTime() < now;
  const sorted = [
    ...events
      .filter((e) => !isPast(e))
      .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()),
    ...events
      .filter(isPast)
      .sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime()),
  ];

  return (
    <div className="dsh-content-row">
      <div className="dsh-content-main" style={{ maxWidth: 880 }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, margin: "0 0 4px", color: "#111111" }}>
        Create event
      </h1>
      <p style={{ color: "#8A8A8A", margin: "0 0 16px", fontSize: 15 }}>
        Describe it in a sentence, import it from a link, or build it by hand.
      </p>
      <div
        style={{
          display: "grid",
          // Rows first: tiles flow across, wrapping onto new rows as needed.
          gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))",
          gap: 12,
          marginBottom: 36,
        }}
      >
        {CREATE_METHODS.map((m) =>
          m.href ? (
            <Link key={m.key} href={m.href} style={{ textDecoration: "none" }}>
              <div style={methodTile}>
                <span style={methodIcon}>
                  <m.Icon size={22} color="#111" />
                </span>
                <span style={methodLabel}>{m.label}</span>
                <span style={methodHint}>{m.hint}</span>
              </div>
            </Link>
          ) : (
            <div key={m.key} style={{ ...methodTile, opacity: 0.55 }}>
              <span style={methodIcon}>
                <m.Icon size={22} color="#111" />
              </span>
              <span style={methodLabel}>
                {m.label}{" "}
                <span style={soonBadge}>Coming soon</span>
              </span>
              <span style={methodHint}>{m.hint}</span>
            </div>
          ),
        )}
      </div>

      <h2 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 4px", color: "#111111" }}>
        Your events
      </h2>
      <p style={{ color: "#8A8A8A", margin: "0 0 18px", fontSize: 15 }}>Sales at a glance.</p>

      {sorted.length === 0 ? (
        <div
          style={{
            background: "#FAFAFA",
            border: "1px solid #E5E5E5",
            borderRadius: 14,
            padding: 32,
            textAlign: "center",
            color: "#8A8A8A",
          }}
        >
          No events yet — create one in the shabanga app.
        </div>
      ) : (
        <div
          className="dsh-event-grid"
          // A lone event keeps the full row; 2+ pair up side by side.
          style={sorted.length === 1 ? { gridTemplateColumns: "1fr" } : undefined}
        >
          {sorted.map((e) => {
            const s = summary[e.id] || {};
            const pill = STATUS[e.status] || STATUS.draft;
            return (
              <Link
                key={e.id}
                href={`/dashboard/events/${e.id}`}
                style={{ textDecoration: "none", color: "inherit", display: "block", height: "100%" }}
              >
              <div
                style={{
                  background: "#FAFAFA",
                  border: "1px solid #E5E5E5",
                  borderRadius: 14,
                  padding: 16,
                  display: "flex",
                  gap: 14,
                  alignItems: "flex-start",
                  height: "100%",
                  boxSizing: "border-box",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={e.flyerUrl || "/logo.png"}
                  alt=""
                  width={56}
                  height={56}
                  style={{ borderRadius: 10, objectFit: "cover", background: "#ECECEC", flexShrink: 0 }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: "#111111",
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
                  <div style={{ fontSize: 13, color: "#8A8A8A", marginTop: 2 }}>
                    {fmtDate(e.eventDate)} · {e.venueName}
                  </div>
                  {typeof s.sold === "number" ? <EventStats s={s} /> : null}
                </div>
              </div>
              </Link>
            );
          })}
        </div>
      )}
      </div>
      <TipsRail tips={tips} />
    </div>
  );
}

// Method tile styles — the app's Option card (light card, white icon circle,
// label + hint) translated to web.
const methodTile: React.CSSProperties = {
  background: "#F8F8F8",
  border: "1px solid #ECECEC",
  borderRadius: 16,
  padding: 16,
  display: "flex",
  flexDirection: "column",
  gap: 8,
  height: "100%",
  boxSizing: "border-box",
};
const methodIcon: React.CSSProperties = {
  width: 44,
  height: 44,
  borderRadius: 22,
  background: "#fff",
  border: "1px solid #ECECEC",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
const methodLabel: React.CSSProperties = { fontSize: 15, fontWeight: 700, color: "#111" };
const methodHint: React.CSSProperties = { fontSize: 12.5, color: "#8A8A8A", lineHeight: 1.4 };
const soonBadge: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  color: "#888",
  background: "#ECECEC",
  borderRadius: 6,
  padding: "2px 6px",
  verticalAlign: "middle",
};
