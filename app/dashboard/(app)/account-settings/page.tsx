import Link from "next/link";

export default function AccountSettingsStub() {
  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      <Link href="/dashboard" style={{ color: "#6C5CE7", fontWeight: 700, fontSize: 14 }}>
        ← Dashboard
      </Link>
      <h1 style={{ fontSize: 24, fontWeight: 800, margin: "12px 0 8px" }}>Account Settings</h1>
      <p style={{ color: "#777", fontSize: 15, lineHeight: 1.6 }}>
        Email and payout setup are managed in the fansonly app for now. Managing
        them on the web is coming soon.
      </p>
    </div>
  );
}
