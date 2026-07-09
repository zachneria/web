import Link from "next/link";
import type { IconType } from "react-icons";
import {
  IoGlobeOutline,
  IoMegaphoneOutline,
  IoMusicalNotesOutline,
  IoSettingsOutline,
  IoTicketOutline,
} from "react-icons/io5";

import { getOrgClaims, orgFetch } from "@/lib/org-api";

export const dynamic = "force-dynamic";

// Account hub — mirrors the app's Account screen (Events / Promoter Settings /
// Marketing / Account Settings). Icons match the app's Account rows
// (globe/megaphone/settings-outline). Marketing (the blast composer) is the live
// one; the others land on coming-soon stubs for now.
const ROWS: { href: string; Icon: IconType; label: string; hint: string; live: boolean }[] = [
  { href: "/dashboard/events", Icon: IoTicketOutline, label: "Your Events", hint: "Sales + stats at a glance", live: true },
  { href: "/dashboard/marketing", Icon: IoMegaphoneOutline, label: "Marketing", hint: "Email your fans — blasts + AI draft", live: true },
  { href: "/dashboard/promoter-settings", Icon: IoGlobeOutline, label: "Promoter Settings", hint: "Your promoter page + logo", live: true },
  { href: "/dashboard/account-settings", Icon: IoSettingsOutline, label: "Account Settings", hint: "Email + payouts", live: true },
];

export default async function DashboardHub() {
  const { email, name, sub } = await getOrgClaims();
  const initial = (name || email || "?").charAt(0).toUpperCase();

  // Pull the promoter logo (set in Promoter Settings) for the avatar, and the
  // talent role (having a profile = being an artist) for the Artist row.
  let logoUrl: string | null = null;
  let isTalent = false;
  if (sub) {
    try {
      const [r, t] = await Promise.all([orgFetch(`/users/${sub}`), orgFetch("/users/talent/me")]);
      if (r.ok) logoUrl = (await r.json())?.logoUrl ?? null;
      isTalent = t.ok;
    } catch {
      /* best-effort — fall back to the initial */
    }
  }

  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      <div style={{ textAlign: "center", padding: "16px 0 28px" }}>
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt=""
            width={72}
            height={72}
            style={{
              borderRadius: 36,
              objectFit: "cover",
              border: "3px solid #F5E642",
              background: "#1E1E1E",
              margin: "0 auto 12px",
              display: "block",
            }}
          />
        ) : (
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
        )}
        <div style={{ fontSize: 22, fontWeight: 800, color: "#F2F2F2" }}>{name || "Organizer"}</div>
        {email ? <div style={{ fontSize: 14, color: "#8F8F8F", marginTop: 2 }}>{email}</div> : null}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {(isTalent
          ? [
              ...ROWS.slice(0, 3),
              {
                href: "/dashboard/artist-settings",
                Icon: IoMusicalNotesOutline,
                label: "Artist Settings",
                hint: "Your artist page, rates + gig history",
                live: true,
                accent: "#AF52DE", // the talent accent
              },
              ...ROWS.slice(3),
            ]
          : ROWS
        ).map((r) => (
          <Link
            key={r.href}
            href={r.href}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              background: "#1E1E1E",
              border: "1px solid #2E2E2E",
              borderRadius: 14,
              padding: "16px 18px",
              textDecoration: "none",
            }}
          >
            <r.Icon size={24} color={(r as { accent?: string }).accent ?? "#F5E642"} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1 }}>
              <span style={{ display: "block", fontSize: 16, fontWeight: 700, color: "#F2F2F2" }}>
                {r.label}
                {!r.live ? (
                  <span style={{ fontSize: 11, color: "#8F8F8F", fontWeight: 600 }}> · soon</span>
                ) : null}
              </span>
              <span style={{ display: "block", fontSize: 13, color: "#8F8F8F", marginTop: 2 }}>
                {r.hint}
              </span>
            </span>
            <span style={{ color: "#8F8F8F", fontSize: 20 }}>›</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
