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
  const { email, name, sub } = await getOrgClaims();
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
          <span style={{ color: "#fff", fontWeight: 800, fontSize: 18, letterSpacing: -0.3 }}>fansonly</span>
        </Link>
        <SignOutButton />
      </header>
      <div className="dsh-body">
        <aside className="dsh-side">
          <div className="dsh-user">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="" width={42} height={42} className="dsh-avatar" />
            ) : (
              <div className="dsh-avatar dsh-avatar-fallback">{initial}</div>
            )}
            <div className="dsh-user-meta">
              <span className="dsh-user-name">{name || "Organizer"}</span>
              {email ? <span className="dsh-user-email">{email}</span> : null}
            </div>
          </div>
          <DashNav isTalent={isTalent} />
        </aside>
        <main className="dsh-main">{children}</main>
      </div>
    </div>
  );
}
