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

export default function Scripts({ markdown }: { markdown: string }) {
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
