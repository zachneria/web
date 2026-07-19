export const metadata = {
  title: "Scan tickets — shabanga",
  robots: { index: false, follow: false },
};

// shabanga.com/scan?e=<id>&mode=<mode> — the fallback when the app ISN'T
// installed (with the app, the universal link opens the native scanner
// instead). Scanning needs the camera, so this points staff to the app.
export default function ScanFallback() {
  return (
    <div
      style={{
        minHeight: "100dvh",
        background:
          "radial-gradient(600px 320px at 85% -8%, rgba(15,167,181,.18), transparent 60%), #0f0f12",
        color: "#f4efe6",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        gap: 14,
        padding: 28,
      }}
    >
      <div style={{ fontSize: 52 }}>📷</div>
      <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>
        Scanning needs the app
      </h1>
      <p style={{ color: "#9a95ab", fontSize: 15, maxWidth: 340, margin: 0, lineHeight: 1.5 }}>
        The door scanner uses your camera, so it runs in the shabanga app.
        Install it, then reopen this link — it&rsquo;ll open straight into the
        scanner and ask for the door PIN.
      </p>
      <a
        href="https://shabanga.com"
        style={{
          marginTop: 8,
          background: "#0FA7B5",
          color: "#06333a",
          fontWeight: 800,
          fontSize: 16,
          padding: "13px 30px",
          borderRadius: 14,
          textDecoration: "none",
        }}
      >
        Get the shabanga app →
      </a>
      <p style={{ color: "#6e6a7a", fontSize: 12.5, marginTop: 6 }}>
        Already have it? Reopen the link from your messages.
      </p>
    </div>
  );
}
