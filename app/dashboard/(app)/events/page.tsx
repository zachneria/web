import Link from "next/link";

import { getDashboard, type DashEvent } from "@/lib/org-api";

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

export default async function DashboardEvents() {
  const { events, summary } = await getDashboard();
  const sorted = [...events].sort(
    (a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime(),
  );

  return (
    <>
      <Link href="/dashboard" style={{ color: "#6C5CE7", fontWeight: 700, fontSize: 14 }}>
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
                  alignItems: "center",
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
                  {typeof s.sold === "number" && (
                    <div style={{ fontSize: 13, color: "#111", marginTop: 6, fontWeight: 600 }}>
                      {s.sold}
                      {typeof s.capacity === "number" ? ` / ${s.capacity}` : ""} sold
                      {typeof s.checkedIn === "number" && s.checkedIn > 0
                        ? ` · ${s.checkedIn} checked in`
                        : ""}
                      {typeof s.guests === "number" && s.guests > 0 ? ` · ${s.guests} guests` : ""}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
