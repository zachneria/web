import Link from "next/link";

import { SignOutButton } from "@/components/sign-out-button";
import { getOrgClaims, orgFetch } from "@/lib/org-api";

import { DashNav } from "./DashNav";

// Authed organizer chrome. Shell: full-width dark brand bar (thin yellow line),
// light-gray sidebar with the user's identity + icon-only nav (teal selection),
// white content. Dark = the public nightlife face; light = the workspace —
// the same split the app makes with its organizer zone.
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { email, name, sub, isAdmin } = await getOrgClaims();
  const initial = (name || email || "?").charAt(0).toUpperCase();

  let logoUrl: string | null = null;
  let isTalent = false;
  if (sub) {
    try {
      const [r, t] = await Promise.all([orgFetch(`/users/${sub}`), orgFetch("/users/talent/me")]);
      if (r.ok) logoUrl = (await r.json())?.logoUrl ?? null;
      isTalent = t.ok;
    } catch {
      /* best-effort chrome */
    }
  }

  return (
    <div className="dsh-root">
      <header className="dsh-top">
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon.png" alt="" width={26} height={26} style={{ borderRadius: 6 }} />
          <span style={{ color: "#0FA7B5", fontFamily: "Cochin, Georgia, serif", fontWeight: 700, fontSize: 21, letterSpacing: 0.3 }}>shabanga</span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt=""
              title={name || "Organizer"}
              width={30}
              height={30}
              style={{ borderRadius: "50%", objectFit: "cover", border: "2px solid #0FA7B5", background: "#fff" }}
            />
          ) : (
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                background: "#0FA7B5",
                color: "#161616",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: 14,
              }}
            >
              {initial}
            </div>
          )}
          <SignOutButton />
        </div>
      </header>
      <div className="dsh-body">
        <aside className="dsh-side">
          <DashNav isTalent={isTalent} isAdmin={!!isAdmin} />
        </aside>
        <main className="dsh-main">{children}</main>
      </div>
    </div>
  );
}
