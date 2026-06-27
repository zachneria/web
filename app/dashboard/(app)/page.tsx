import Link from "next/link";

import { getOrgClaims } from "@/lib/org-api";

export const dynamic = "force-dynamic";

// Account hub — mirrors the app's Account screen (Events / Promoter Settings /
// Marketing / Account Settings). Marketing (the blast composer) is the live one;
// the others land on coming-soon stubs for now.
const ROWS = [
  { href: "/dashboard/events", icon: "🎟️", label: "Your Events", hint: "Sales + stats at a glance", live: true },
  { href: "/dashboard/marketing", icon: "📣", label: "Marketing", hint: "Email your fans — blasts + AI draft", live: true },
  { href: "/dashboard/promoter-settings", icon: "🌐", label: "Promoter Settings", hint: "Your promoter page + logo", live: true },
  { href: "/dashboard/account-settings", icon: "⚙️", label: "Account Settings", hint: "Email + payouts", live: true },
];

export default async function DashboardHub() {
  const { email, name } = await getOrgClaims();
  const initial = (name || email || "?").charAt(0).toUpperCase();

  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      <div style={{ textAlign: "center", padding: "16px 0 28px" }}>
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 36,
            background: "#F5E642",
            color: "#000",
            fontSize: 30,
            fontWeight: 800,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 12px",
          }}
        >
          {initial}
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: "#111" }}>{name || "Organizer"}</div>
        {email ? <div style={{ fontSize: 14, color: "#777", marginTop: 2 }}>{email}</div> : null}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {ROWS.map((r) => (
          <Link
            key={r.href}
            href={r.href}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              background: "#fff",
              border: "1px solid #eee",
              borderRadius: 14,
              padding: "16px 18px",
              textDecoration: "none",
            }}
          >
            <span style={{ fontSize: 22 }}>{r.icon}</span>
            <span style={{ flex: 1 }}>
              <span style={{ display: "block", fontSize: 16, fontWeight: 700, color: "#111" }}>
                {r.label}
                {!r.live ? (
                  <span style={{ fontSize: 11, color: "#aaa", fontWeight: 600 }}> · soon</span>
                ) : null}
              </span>
              <span style={{ display: "block", fontSize: 13, color: "#888", marginTop: 2 }}>
                {r.hint}
              </span>
            </span>
            <span style={{ color: "#ccc", fontSize: 20 }}>›</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
