import Link from "next/link";

// Right-side "don't forget" rail — contextual setup nudges computed by each
// page from real state (payouts unconnected, Passports not set up, …).
// Renders nothing when there's nothing to nag about.

export interface Tip {
  key: string;
  title: string;
  body: string;
  href?: string;
  cta?: string;
}

export function TipsRail({ tips, title = "Don't forget" }: { tips: Tip[]; title?: string }) {
  if (tips.length === 0) return null;
  return (
    <aside className="dsh-tips">
      <div
        style={{
          fontSize: 12,
          fontWeight: 800,
          color: "#8A8A8A",
          textTransform: "uppercase",
          letterSpacing: 0.6,
        }}
      >
        💡 {title}
      </div>
      {tips.map((t) => (
        <div
          key={t.key}
          style={{
            background: "#FFFCE8",
            border: "none",
            borderRadius: 12,
            padding: "12px 14px",
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 700, color: "#22243A", marginBottom: 4 }}>
            {t.title}
          </div>
          <div style={{ fontSize: 13, color: "#555", lineHeight: 1.45 }}>{t.body}</div>
          {t.href ? (
            <Link
              href={t.href}
              style={{
                display: "inline-block",
                marginTop: 8,
                fontSize: 13,
                fontWeight: 700,
                color: "#0B8896",
              }}
            >
              {t.cta ?? "Set it up"} →
            </Link>
          ) : null}
        </div>
      ))}
    </aside>
  );
}
