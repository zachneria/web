import Link from "next/link";

import { SignOutButton } from "@/components/sign-out-button";

// Authed organizer chrome (the /dashboard/login page lives outside this group, so
// it doesn't get the topbar). Middleware guarantees a session before we render.
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ minHeight: "100vh", background: "#FAFAF8" }}>
      <header
        style={{
          background: "#161616",
          borderBottom: "4px solid #F5E642",
        }}
      >
        <div
          style={{
            maxWidth: 960,
            margin: "0 auto",
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              textDecoration: "none",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon.png" alt="" width={26} height={26} style={{ borderRadius: 6 }} />
            <span style={{ color: "#fff", fontWeight: 800, fontSize: 18, letterSpacing: -0.3 }}>
              fansonly
            </span>
            <span style={{ color: "#9b9b9b", fontWeight: 600, fontSize: 14 }}>Dashboard</span>
          </Link>
          <SignOutButton />
        </div>
      </header>
      <main style={{ maxWidth: 960, margin: "0 auto", padding: "24px 16px 64px" }}>
        {children}
      </main>
    </div>
  );
}
