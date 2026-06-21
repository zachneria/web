"use client";

import { type CSSProperties, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";

const BRAND = "#F5E642";

// Flatten markdown heading children to a plain string for slug/anchor ids.
function textOf(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (node && typeof node === "object" && "props" in node) {
    return textOf((node as { props: { children?: ReactNode } }).props.children);
  }
  return "";
}
const slug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export default function Scripts({
  markdown,
  bugFormUrl,
}: {
  markdown: string;
  bugFormUrl: string | null;
}) {
  // Section nav = the "## " headings (Parts + Before you start).
  const sections = markdown
    .split("\n")
    .filter((l) => l.startsWith("## "))
    .map((l) => l.replace(/^##\s+/, "").trim());

  return (
    <div style={styles.page}>
      <div style={styles.bar}>
        <span style={styles.brandDot}>☺</span>
        <span style={styles.barTitle}>fansonly · Beta</span>
        {bugFormUrl && (
          <a
            style={styles.report}
            href={bugFormUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            🐞 Report a bug
          </a>
        )}
        <button style={styles.print} onClick={() => window.print()}>
          Print / PDF
        </button>
      </div>

      <div style={styles.wrap}>
        <nav style={styles.toc} className="beta-no-print">
          <div style={styles.tocHead}>Sections</div>
          {sections.map((s) => (
            <a key={s} href={`#${slug(s)}`} style={styles.tocLink}>
              {s}
            </a>
          ))}
        </nav>

        <article className="beta-doc" style={styles.doc}>
          {bugFormUrl && (
            <a
              style={styles.callout}
              href={bugFormUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="beta-no-print"
            >
              <span>🐞 Found a bug or have feedback?</span>
              <span style={styles.calloutCta}>Report it →</span>
            </a>
          )}
          <ReactMarkdown
            components={{
              h2: ({ children }) => <h2 id={slug(textOf(children))}>{children}</h2>,
              h3: ({ children }) => <h3 id={slug(textOf(children))}>{children}</h3>,
            }}
          >
            {markdown}
          </ReactMarkdown>
        </article>
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  page: { minHeight: "100dvh", background: "#fff" },
  bar: {
    position: "sticky",
    top: 0,
    zIndex: 10,
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "#161616",
    borderBottom: `4px solid ${BRAND}`,
    padding: "12px 20px",
  },
  brandDot: {
    width: 24,
    height: 24,
    borderRadius: 6,
    background: BRAND,
    color: "#000",
    fontWeight: 700,
    textAlign: "center",
    lineHeight: "24px",
  },
  barTitle: { color: "#fff", fontWeight: 700, fontSize: 15, flex: 1 },
  print: {
    background: "transparent",
    color: BRAND,
    border: `1px solid ${BRAND}`,
    borderRadius: 8,
    padding: "6px 12px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
  report: {
    background: BRAND,
    color: "#000",
    borderRadius: 8,
    padding: "6px 12px",
    fontSize: 13,
    fontWeight: 700,
    textDecoration: "none",
  },
  callout: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    background: "#FBF6DA",
    border: "1px solid #EFE7C2",
    borderRadius: 12,
    padding: "12px 16px",
    margin: "0 0 20px",
    color: "#000",
    fontSize: 15,
    fontWeight: 600,
    textDecoration: "none",
  },
  calloutCta: { color: "#1B873F", fontWeight: 800, whiteSpace: "nowrap" },
  wrap: {
    maxWidth: 1000,
    margin: "0 auto",
    display: "flex",
    gap: 32,
    padding: "24px 20px 80px",
  },
  toc: {
    flex: "0 0 200px",
    position: "sticky",
    top: 80,
    alignSelf: "flex-start",
    display: "flex",
    flexDirection: "column",
    gap: 2,
    maxHeight: "calc(100dvh - 100px)",
    overflowY: "auto",
  },
  tocHead: {
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: "#999",
    marginBottom: 6,
  },
  tocLink: {
    fontSize: 13,
    color: "#444",
    textDecoration: "none",
    padding: "3px 0",
  },
  doc: { flex: 1, minWidth: 0, maxWidth: 720 },
};
