"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

// Find Events — web mirror of the app's buyer Events tab ((tabs)/index.tsx):
// search, Flyers ⇄ Promoters view toggle, 4-way sort, "Happening now" pinned.
// Reads the same public /events/search data (via the dashboard proxy).

interface Result {
  id: string;
  name: string;
  venueName: string;
  eventDate: string;
  endTime?: string | null;
  flyerUrl: string | null;
  organizerName?: string | null;
  organizerLogoUrl?: string | null;
  currentTier?: string | null;
  fromPrice?: number | null;
  createdAt?: string;
  soldPct?: number;
  soldOut?: boolean;
}

type SortKey = "upcoming" | "newest" | "popular" | "price";
type ViewMode = "flyers" | "promoters";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "upcoming", label: "📅 Upcoming" },
  { key: "newest", label: "✨ Newest" },
  { key: "popular", label: "🔥 Popular" },
  { key: "price", label: "$$ Price" },
];
const SORT_HEADINGS: Record<SortKey, string> = {
  upcoming: "Upcoming",
  newest: "Newest",
  popular: "Popular",
  price: "Lowest price",
};

// Same ordering rules as the app's sortEvents.
function sortEvents(list: Result[], key: SortKey): Result[] {
  const byDate = (a: Result, b: Result) =>
    new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime();
  const arr = [...list];
  switch (key) {
    case "newest":
      return arr.sort(
        (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(),
      );
    case "popular":
      return arr.sort((a, b) => (b.soldPct ?? 0) - (a.soldPct ?? 0) || byDate(a, b));
    case "price":
      return arr.sort(
        (a, b) => (a.fromPrice ?? Infinity) - (b.fromPrice ?? Infinity) || byDate(a, b),
      );
    default:
      return arr.sort(byDate);
  }
}

function isLive(e: Result, now: number) {
  const start = new Date(e.eventDate).getTime();
  const end = new Date(e.endTime || e.eventDate).getTime();
  return start <= now && end >= now;
}

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) +
  " · " +
  new Date(s).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

export default function FindEventsPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[] | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("upcoming");
  const [view, setView] = useState<ViewMode>("flyers");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Persisted preferences — mirrors the app's AsyncStorage keys.
  useEffect(() => {
    const v = window.localStorage.getItem("findViewMode");
    if (v === "promoters" || v === "flyers") setView(v);
    const k = window.localStorage.getItem("findSort") as SortKey | null;
    if (k && SORTS.some((s) => s.key === k)) setSortKey(k);
  }, []);
  const pickView = (m: ViewMode) => {
    setView(m);
    window.localStorage.setItem("findViewMode", m);
  };
  const pickSort = (k: SortKey) => {
    setSortKey(k);
    window.localStorage.setItem("findSort", k);
  };

  const runSearch = useCallback(async (q: string) => {
    try {
      const res = await fetch(
        `/api/dashboard/api/events/search${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}`,
      );
      if (res.ok) setResults(await res.json());
      else setResults([]);
    } catch {
      setResults([]);
    }
  }, []);

  useEffect(() => {
    runSearch("");
  }, [runSearch]);

  const onQuery = (q: string) => {
    setQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(q), 350);
  };

  const now = Date.now();
  const all = sortEvents(results ?? [], sortKey);
  const live = all.filter((e) => isLive(e, now));
  const upcoming = all.filter((e) => !isLive(e, now));

  return (
    <div style={{ maxWidth: 980 }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, margin: "0 0 4px", color: "#111" }}>
        Find events
      </h1>
      <p style={{ color: "#8A8A8A", margin: "0 0 16px", fontSize: 15 }}>
        Everything listed publicly on fansonly.
      </p>

      <input
        style={searchInput}
        placeholder="Search events, venues, promoters…"
        value={query}
        onChange={(e) => onQuery(e.target.value)}
      />

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "12px 0 22px" }}>
        <div style={pillGroup}>
          {SORTS.map((s) => (
            <button
              key={s.key}
              onClick={() => pickSort(s.key)}
              style={{ ...pill, ...(sortKey === s.key ? pillOn : {}) }}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div style={pillGroup}>
          {(["flyers", "promoters"] as ViewMode[]).map((m) => (
            <button
              key={m}
              onClick={() => pickView(m)}
              style={{ ...pill, ...(view === m ? pillOn : {}) }}
            >
              {m === "flyers" ? "Flyers" : "Promoters"}
            </button>
          ))}
        </div>
      </div>

      {results === null ? (
        <div style={{ color: "#8A8A8A" }}>Loading…</div>
      ) : all.length === 0 ? (
        <div style={{ color: "#8A8A8A" }}>
          {query.trim() ? "Nothing matches that search." : "No events listed right now."}
        </div>
      ) : (
        <>
          {live.length > 0 ? (
            <>
              <SectionHeading label="Happening now" live />
              <Grid>{live.map((e) => <Card key={e.id} e={e} view={view} live />)}</Grid>
            </>
          ) : null}
          {upcoming.length > 0 ? (
            <>
              <SectionHeading label={SORT_HEADINGS[sortKey]} />
              <Grid>{upcoming.map((e) => <Card key={e.id} e={e} view={view} />)}</Grid>
            </>
          ) : null}
        </>
      )}
    </div>
  );
}

function SectionHeading({ label, live }: { label: string; live?: boolean }) {
  return (
    <div
      style={{
        fontSize: 12,
        fontWeight: 800,
        color: live ? "#8A6D00" : "#8A8A8A",
        textTransform: "uppercase",
        letterSpacing: 0.6,
        margin: "18px 2px 10px",
      }}
    >
      {live ? "⚡ " : ""}
      {label}
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: 12,
      }}
    >
      {children}
    </div>
  );
}

function Card({ e, view, live }: { e: Result; view: ViewMode; live?: boolean }) {
  const img = view === "promoters" ? e.organizerLogoUrl : e.flyerUrl;
  const initial = (e.organizerName || e.name || "?").charAt(0).toUpperCase();
  return (
    <Link href={`/e/${e.id}`} style={{ textDecoration: "none", color: "inherit" }}>
      <div
        style={{
          background: "#FAFAFA",
          border: live ? "2px solid #F5E642" : "1px solid #E5E5E5",
          borderRadius: 14,
          padding: 14,
          display: "flex",
          gap: 12,
          alignItems: "flex-start",
          height: "100%",
          boxSizing: "border-box",
        }}
      >
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={img}
            alt=""
            width={56}
            height={56}
            style={{ borderRadius: 10, objectFit: "cover", background: "#ECECEC", flexShrink: 0 }}
          />
        ) : (
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 10,
              background: "#ECECEC",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: 20,
              color: "#8A8A8A",
              flexShrink: 0,
            }}
          >
            {initial}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "#111",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {e.name}
          </div>
          <div style={{ fontSize: 13, color: live ? "#8A6D00" : "#8A8A8A", marginTop: 2, fontWeight: live ? 700 : 400 }}>
            {live ? "Happening now" : fmtDate(e.eventDate)}
          </div>
          <div style={{ fontSize: 13, color: "#8A8A8A", marginTop: 1 }}>
            {e.venueName}
            {e.organizerName ? ` · ${e.organizerName}` : ""}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6, flexWrap: "wrap" }}>
            {e.soldOut ? (
              <span style={{ ...badge, color: "#C0322B", background: "#FBE6E5" }}>Sold out</span>
            ) : (
              <>
                {typeof e.fromPrice === "number" ? (
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#111" }}>
                    {e.fromPrice === 0 ? "Free" : `From $${e.fromPrice}`}
                  </span>
                ) : null}
                {(e.soldPct ?? 0) >= 80 ? (
                  <span style={{ ...badge, color: "#8A6D00", background: "#FFF3C2" }}>
                    Selling fast
                  </span>
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

const searchInput: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid #D9D9D9",
  borderRadius: 12,
  padding: "12px 14px",
  fontSize: 16,
  background: "#fff",
  color: "#111",
};
const pillGroup: React.CSSProperties = { display: "flex", gap: 6, flexWrap: "wrap" };
const pill: React.CSSProperties = {
  border: "1px solid #D9D9D9",
  background: "#fff",
  color: "#555",
  borderRadius: 999,
  padding: "7px 13px",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
};
// Teal = selected (the on-state language).
const pillOn: React.CSSProperties = {
  border: "1px solid #0FA7B5",
  background: "rgba(15,167,181,0.12)",
  color: "#0B8896",
};
const badge: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  borderRadius: 999,
  padding: "2px 8px",
};
