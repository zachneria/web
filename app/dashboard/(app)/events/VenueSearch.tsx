"use client";

import { useEffect, useRef, useState } from "react";

// Venue/address autocomplete for the web event forms — same fo-events Google
// Places proxy the app uses, reached through the dashboard's generic API
// proxy. Free text stays first-class (unlisted venues just type past it).
interface Suggestion {
  placeId: string;
  primary: string;
  secondary: string;
}

export function VenueSearch({
  venueName,
  onPick,
  onType,
  inputStyle,
}: {
  venueName: string;
  onPick: (v: { name: string; address: string; lat: number | null; lng: number | null }) => void;
  onType: (name: string) => void;
  inputStyle: React.CSSProperties;
}) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const session = useRef(`${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`);

  const type = (text: string) => {
    onType(text);
    if (debounce.current) clearTimeout(debounce.current);
    if (text.trim().length < 3) {
      setOpen(false);
      return;
    }
    debounce.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/dashboard/api/events/places/search?q=${encodeURIComponent(text.trim())}&session=${session.current}`,
        );
        const d = await res.json().catch(() => ({}));
        setSuggestions(d.results ?? []);
        setOpen((d.results ?? []).length > 0);
      } catch {
        setOpen(false);
      }
    }, 300);
  };

  const pick = async (s: Suggestion) => {
    setOpen(false);
    try {
      const res = await fetch(
        `/api/dashboard/api/events/places/details?placeId=${encodeURIComponent(s.placeId)}&session=${session.current}`,
      );
      const d = await res.json();
      session.current = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
      onPick({ name: d.name || s.primary, address: d.address || s.secondary, lat: d.lat ?? null, lng: d.lng ?? null });
    } catch {
      onPick({ name: s.primary, address: s.secondary, lat: null, lng: null });
    }
  };

  useEffect(() => () => {
    if (debounce.current) clearTimeout(debounce.current);
  }, []);

  return (
    <div style={{ position: "relative" }}>
      <input
        style={inputStyle}
        value={venueName}
        onChange={(e) => type(e.target.value)}
        placeholder="Search a venue or address"
        autoComplete="off"
      />
      {open ? (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            zIndex: 20,
            background: "#161616",
            borderRadius: 12,
            marginTop: 4,
            overflow: "hidden",
            boxShadow: "0 10px 30px rgba(0,0,0,.3)",
          }}
        >
          {suggestions.map((s) => (
            <button
              key={s.placeId}
              onClick={() => pick(s)}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "10px 14px",
              }}
            >
              <span style={{ display: "block", color: "#fff", fontSize: 14, fontWeight: 700 }}>{s.primary}</span>
              {s.secondary ? (
                <span style={{ display: "block", color: "#9A9A9A", fontSize: 12 }}>{s.secondary}</span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
