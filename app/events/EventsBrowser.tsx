"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import type { IconType } from "react-icons";
import {
  IoCalendarOutline,
  IoFlameOutline,
  IoFlashOutline,
  IoPricetagsOutline,
  IoSparklesOutline,
} from "react-icons/io5";

import type { FindEvent } from "@/lib/backend";

// Client half of the public /events page: search + sort over the
// server-rendered initial list. Same sort rules and Happening-now split as
// the app's Find Events tab.

type SortKey = "upcoming" | "newest" | "popular" | "price";

// Outline Ionicons (the app's icon language) — no emoji.
const SORTS: { key: SortKey; label: string; Icon: IconType }[] = [
  { key: "upcoming", label: "Upcoming", Icon: IoCalendarOutline },
  { key: "newest", label: "Newest", Icon: IoSparklesOutline },
  { key: "popular", label: "Popular", Icon: IoFlameOutline },
  { key: "price", label: "Price", Icon: IoPricetagsOutline },
];
const SORT_HEADINGS: Record<SortKey, string> = {
  upcoming: "Upcoming",
  newest: "Newest",
  popular: "Popular",
  price: "Lowest price",
};

function sortEvents(list: FindEvent[], key: SortKey): FindEvent[] {
  const byDate = (a: FindEvent, b: FindEvent) =>
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

function isLive(e: FindEvent, now: number) {
  const start = new Date(e.eventDate).getTime();
  const end = new Date(e.endTime || e.eventDate).getTime();
  return start <= now && end >= now;
}

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) +
  " · " +
  new Date(s).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

export function EventsBrowser({ initial }: { initial: FindEvent[] }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FindEvent[]>(initial);
  const [sortKey, setSortKey] = useState<SortKey>("upcoming");
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSearch = useCallback(async (q: string) => {
    setSearching(true);
    try {
      const res = await fetch(`/api/find${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}`);
      if (res.ok) setResults(await res.json());
    } catch {
      /* keep current results */
    } finally {
      setSearching(false);
    }
  }, []);

  const onQuery = (q: string) => {
    setQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(q), 350);
  };

  const now = Date.now();
  const all = sortEvents(results, sortKey);
  const live = all.filter((e) => isLive(e, now));
  const upcoming = all.filter((e) => !isLive(e, now));

  return (
    <>
      <input
        className="find-search"
        placeholder="Search events, venues, promoters…"
        value={query}
        onChange={(e) => onQuery(e.target.value)}
      />
      <div className="find-sorts">
        {SORTS.map((s) => (
          <button
            key={s.key}
            onClick={() => setSortKey(s.key)}
            className={`find-pill${sortKey === s.key ? " find-pill-on" : ""}`}
          >
            <s.Icon size={14} />
            {s.label}
          </button>
        ))}
      </div>

      {all.length === 0 ? (
        <p className="find-empty">
          {searching
            ? "Searching…"
            : query.trim()
              ? "Nothing matches that search."
              : "No shows listed right now — check back soon."}
        </p>
      ) : (
        <>
          {live.length > 0 ? (
            <>
              <div className="find-heading find-heading-live"><IoFlashOutline size={13} /> Happening now</div>
              <div className="find-grid">
                {live.map((e) => (
                  <EventCard key={e.id} e={e} live />
                ))}
              </div>
            </>
          ) : null}
          {upcoming.length > 0 ? (
            <>
              <div className="find-heading">{SORT_HEADINGS[sortKey]}</div>
              <div className="find-grid">
                {upcoming.map((e) => (
                  <EventCard key={e.id} e={e} />
                ))}
              </div>
            </>
          ) : null}
        </>
      )}
    </>
  );
}

function EventCard({ e, live }: { e: FindEvent; live?: boolean }) {
  const router = useRouter();
  // Legacy flyers can be un-renderable in browsers (e.g. iPhone .heic
  // uploads) — onError swaps to the initials fallback instead of a broken icon.
  const [flyerBroken, setFlyerBroken] = useState(false);
  const promoterPath = e.organizerHandle || e.organizerId ? `/p/${e.organizerHandle ?? e.organizerId}` : null;
  return (
    <Link href={`/e/${e.id}`} className={`find-card${live ? " find-card-live" : ""}`}>
      {e.flyerUrl && !flyerBroken ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={e.flyerUrl} alt="" className="find-card-flyer" onError={() => setFlyerBroken(true)} />
      ) : (
        <div className="find-card-flyer find-card-flyer-fallback">
          {(e.name || "?").charAt(0).toUpperCase()}
        </div>
      )}
      <div className="find-card-body">
        <span className="find-card-name">{e.name}</span>
        <span className={`find-card-date${live ? " find-card-date-live" : ""}`}>
          {live ? "Happening now" : fmtDate(e.eventDate)}
        </span>
        <span className="find-card-venue">{e.venueName}</span>
        {e.organizerName ? (
          // Chip inside the card link — navigate to /p without triggering /e.
          <span
            className="find-chip"
            role={promoterPath ? "link" : undefined}
            onClick={
              promoterPath
                ? (ev) => {
                    ev.preventDefault();
                    ev.stopPropagation();
                    router.push(promoterPath);
                  }
                : undefined
            }
          >
            {e.organizerLogoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={e.organizerLogoUrl} alt="" />
            ) : (
              <span className="find-chip-initial">
                {(e.organizerName || "?").charAt(0).toUpperCase()}
              </span>
            )}
            {e.organizerName}
          </span>
        ) : null}
        <span className="find-card-meta">
          {e.soldOut ? (
            <span className="find-badge find-badge-out">Sold out</span>
          ) : (
            <>
              {typeof e.fromPrice === "number" ? (
                <span className="find-card-price">
                  {e.fromPrice === 0 ? "Free" : `From $${e.fromPrice}`}
                </span>
              ) : null}
              {(e.soldPct ?? 0) >= 80 ? (
                <span className="find-badge find-badge-fast">Selling fast</span>
              ) : null}
            </>
          )}
        </span>
      </div>
    </Link>
  );
}
