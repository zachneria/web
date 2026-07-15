"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { cleanHandleInput } from "@/lib/handle-input";

// Web mirror of the app's Artist Settings screen (dark, purple = talent accent,
// teal = on-state toggles, yellow = save). Photo upload stays in the app, like
// the promoter logo. Reads/writes via /api/dashboard/talent (users service);
// rate history via the generic payouts proxy.

interface TalentProfile {
  stageName: string | null;
  talentHandle: string | null;
  bio: string | null;
  genres: string | null;
  city: string | null;
  photoUrl: string | null;
  mixUrl: string | null;
  suggestedRate: number | string | null;
  showRate: boolean;
  discoverable: boolean;
  payeeApp: string | null;
  payeeHandle: string | null;
  links: Partial<Record<"instagram" | "facebook" | "tiktok" | "youtube" | "spotify", string>> | null;
  bookingEmail: string | null;
}
interface Gig {
  costId: string;
  eventName: string;
  eventDate: string;
  organizerName: string;
  amount: number;
  paidAt: string | null;
}

const PAYEE_APPS = [
  { value: "venmo", label: "Venmo" },
  { value: "cashapp", label: "Cash App" },
  { value: "zelle", label: "Zelle" },
  { value: "paypal", label: "PayPal" },
  { value: "other", label: "Other" },
];

export default function ArtistSettings() {
  const [loaded, setLoaded] = useState(false);
  const [notTalent, setNotTalent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [stageName, setStageName] = useState("");
  const [talentHandle, setTalentHandle] = useState("");
  const [handleWarn, setHandleWarn] = useState<string | null>(null);
  const [savedTalentHandle, setSavedTalentHandle] = useState<string | null>(null);
  const [fallbackHandle, setFallbackHandle] = useState<string | null>(null);
  const [bio, setBio] = useState("");
  const [genres, setGenres] = useState("");
  const [city, setCity] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [mixUrl, setMixUrl] = useState("");
  const [bookingEmail, setBookingEmail] = useState("");
  const [rate, setRate] = useState("");
  const [showRate, setShowRate] = useState(false);
  const [discoverable, setDiscoverable] = useState(false);
  const [payeeApp, setPayeeApp] = useState("");
  const [payeeHandle, setPayeeHandle] = useState("");
  const [ig, setIg] = useState("");
  const [tt, setTt] = useState("");
  const [sp, setSp] = useState("");
  const [fb, setFb] = useState("");
  const [gigs, setGigs] = useState<Gig[]>([]);

  const apply = (p: TalentProfile) => {
    setStageName(p.stageName ?? "");
    setTalentHandle(p.talentHandle ?? "");
    setSavedTalentHandle(p.talentHandle ?? null);
    setBio(p.bio ?? "");
    setGenres(p.genres ?? "");
    setCity(p.city ?? "");
    setPhotoUrl(p.photoUrl);
    setMixUrl(p.mixUrl ?? "");
    setBookingEmail(p.bookingEmail ?? "");
    setRate(p.suggestedRate != null ? String(Number(p.suggestedRate)) : "");
    setShowRate(p.showRate);
    setDiscoverable(p.discoverable);
    setPayeeApp(p.payeeApp ?? "");
    setPayeeHandle(p.payeeHandle ?? "");
    setIg(p.links?.instagram ?? "");
    setTt(p.links?.tiktok ?? "");
    setSp(p.links?.spotify ?? "");
    setFb(p.links?.facebook ?? "");
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/dashboard/talent");
        if (res.status === 404) {
          setNotTalent(true);
          return;
        }
        const d = await res.json();
        apply(d);
        // Promoter handle = the /a/ fallback when no artist handle is set.
        fetch("/api/dashboard/profile")
          .then((r) => r.json())
          .then((p) => setFallbackHandle(p.handle ?? null))
          .catch(() => {});
        // Rate history — best-effort.
        fetch("/api/dashboard/api/payouts/talent/history")
          .then((r) => r.json())
          .then((h) => setGigs(h.gigs ?? []))
          .catch(() => {});
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const save = async () => {
    const h = talentHandle.trim().toLowerCase();
    if (
      savedTalentHandle &&
      h &&
      h !== savedTalentHandle &&
      !window.confirm(
        `Change your artist link? shabanga.com/a/${savedTalentHandle} will stop working — anything printed or posted with it breaks.`,
      )
    ) {
      return;
    }
    const r = rate.trim() === "" ? null : parseFloat(rate);
    if (r != null && (isNaN(r) || r < 0)) {
      setMsg({ ok: false, text: "Enter a valid suggested rate." });
      return;
    }
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/dashboard/talent", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stageName: stageName.trim() || null,
          talentHandle: talentHandle.trim() || null,
          bio: bio.trim() || null,
          genres: genres.trim() || null,
          city: city.trim() || null,
          mixUrl: mixUrl.trim() || null,
          bookingEmail: bookingEmail.trim() || null,
          suggestedRate: r,
          showRate,
          discoverable,
          payeeApp: payeeApp || null,
          payeeHandle: payeeHandle.trim() || null,
          links: {
            instagram: ig.trim() || null,
            tiktok: tt.trim() || null,
            spotify: sp.trim() || null,
            facebook: fb.trim() || null,
          },
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg({ ok: false, text: d.error || "Couldn't save. Try again." });
        return;
      }
      apply(d);
      setMsg({ ok: true, text: "Saved ✓" });
      setTimeout(() => setMsg(null), 2500);
    } finally {
      setSaving(false);
    }
  };

  const publicHandle = talentHandle.trim() || fallbackHandle;
  const year = new Date().getFullYear();
  const yearGigs = gigs.filter((g) => new Date(g.eventDate).getFullYear() === year);
  const yearTotal = yearGigs.reduce((s, g) => s + g.amount, 0);

  if (!loaded) return <p style={{ color: "#8A8A8A", textAlign: "center" }}>Loading…</p>;
  if (notTalent) {
    return (
      <div style={{ maxWidth: 640, textAlign: "center", color: "#8A8A8A" }}>
        <p>This account doesn&apos;t have the artist role yet.</p>
        
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 640, display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <Link href="/dashboard" style={{ color: "#AF52DE", fontWeight: 700, fontSize: 14 }}>← Account</Link>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: "#161616", margin: "10px 0 0" }}>Artist settings</h1>

      </div>

      {/* Photo + stage name */}
      <div style={card}>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoUrl} alt="" width={72} height={72} style={{ borderRadius: 36, objectFit: "cover", border: "3px solid #AF52DE", flexShrink: 0 }} />
          ) : (
            <div style={{ width: 72, height: 72, borderRadius: 36, background: "#ECECEC", border: "3px solid #AF52DE", display: "flex", alignItems: "center", justifyContent: "center", color: "#AF52DE", fontSize: 26, fontWeight: 800, flexShrink: 0 }}>
              {(stageName || "?").charAt(0).toUpperCase()}
            </div>
          )}
          <div style={{ flex: 1 }}>
            <div style={label}>STAGE NAME</div>
            <input style={input} value={stageName} onChange={(e) => setStageName(e.target.value)} placeholder="e.g. BUMPS" />
            <div style={{ fontSize: 12, color: "#666", marginTop: 6 }}>Press photo updates in the app.</div>
          </div>
        </div>
      </div>

      {/* Profile */}
      <div style={card}>
        <div style={label}>ARTIST LINK</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: "#8A8A8A", fontSize: 14, whiteSpace: "nowrap" }}>shabanga.com/a/</span>
          <input
            style={{ ...input, flex: 1 }}
            value={talentHandle}
            onChange={(e) => {
              const { value, warning } = cleanHandleInput(e.target.value);
              setTalentHandle(value);
              setHandleWarn(warning);
            }}
            placeholder={fallbackHandle || "your-name"}
          />
        </div>
        {handleWarn ? (
          <div style={{ color: "#FF6B61", fontSize: 12, marginTop: 6 }}>{handleWarn}</div>
        ) : null}
        {publicHandle ? (
          <div style={{ marginTop: 8 }}>
            <div style={{ color: "#0B8896", fontSize: 12 }}>
              Live at shabanga.com/a/{publicHandle}
            </div>
            <a
              href={`https://shabanga.com/a/${publicHandle}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: "inline-block", marginTop: 6, color: "#AF52DE", fontSize: 14, fontWeight: 600 }}
            >
              View page ↗
            </a>
          </div>
        ) : null}

        <div style={{ ...label, marginTop: 14 }}>BIO</div>
        <textarea style={{ ...input, minHeight: 70, resize: "vertical" }} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Basement-bred selector. Long blends, no requests." />

        <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
          <div style={{ flex: 1 }}>
            <div style={label}>GENRES</div>
            <input style={input} value={genres} onChange={(e) => setGenres(e.target.value)} placeholder="House, Techno" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={label}>CITY</div>
            <input style={input} value={city} onChange={(e) => setCity(e.target.value)} placeholder="Los Angeles" />
          </div>
        </div>

        <div style={{ ...label, marginTop: 14 }}>FEATURED MIX URL</div>
        <input style={input} value={mixUrl} onChange={(e) => setMixUrl(e.target.value)} placeholder="https://soundcloud.com/you/your-mix" />

        <div style={{ ...label, marginTop: 14 }}>BOOKING EMAIL</div>
        <input style={input} value={bookingEmail} onChange={(e) => setBookingEmail(e.target.value)} placeholder="bookings@you.com" inputMode="email" />
        <div style={{ fontSize: 12, color: "#666", marginTop: 6 }}>
          Where &ldquo;Book {stageName || "you"}&rdquo; inquiries go — shown publicly on your page.
        </div>
      </div>

      {/* Socials */}
      <div style={card}>
        <div style={label}>SOCIAL LINKS</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input style={input} value={ig} onChange={(e) => setIg(e.target.value)} placeholder="Instagram — @yourhandle or URL" />
          <input style={input} value={tt} onChange={(e) => setTt(e.target.value)} placeholder="TikTok — @yourhandle or URL" />
          <input style={input} value={sp} onChange={(e) => setSp(e.target.value)} placeholder="Spotify — https://open.spotify.com/artist/…" />
          <input style={input} value={fb} onChange={(e) => setFb(e.target.value)} placeholder="Facebook — https://facebook.com/yourpage" />
        </div>
        <div style={{ fontSize: 12, color: "#666", marginTop: 8 }}>Shown as icons on your public artist page.</div>
      </div>

      {/* Rate + toggles */}
      <div style={card}>
        <div style={label}>SUGGESTED RATE</div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4, ...input, width: 140 }}>
            <span style={{ fontSize: 18, fontWeight: 800, color: "#161616" }}>$</span>
            <input
              style={{ border: "none", background: "transparent", color: "#161616", fontSize: 18, fontWeight: 800, width: "100%", outline: "none" }}
              value={rate}
              onChange={(e) => setRate(e.target.value.replace(/[^0-9.]/g, ""))}
              placeholder="300"
              inputMode="decimal"
            />
          </div>
          <span style={{ color: "#8A8A8A", fontSize: 12 }}>per set / starting point</span>
        </div>
        <div style={{ fontSize: 12, color: "#666", marginTop: 8 }}>
          Shown as &ldquo;from ${rate || "X"}&rdquo; on your public page — a suggestion, not a lock.
        </div>

        <Toggle
          on={showRate}
          onChange={setShowRate}
          title="Show rate on my public page"
          sub={showRate && publicHandle ? `Visible on shabanga.com/a/${publicHandle}` : "Hidden — rate stays private"}
        />
        <Toggle
          on={discoverable}
          onChange={setDiscoverable}
          title="Bookable by promoters"
          sub={discoverable ? "Promoters can find + link you when adding costs" : "Hidden from promoter search"}
        />
      </div>

      {/* Payout autofill */}
      <div style={card}>
        <div style={label}>PREFERRED PAYOUT (AUTOFILLS FOR PROMOTERS)</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {PAYEE_APPS.map((a) => {
            const active = payeeApp === a.value;
            return (
              <button
                key={a.value}
                onClick={() => setPayeeApp(active ? "" : a.value)}
                style={{
                  border: `1.5px solid ${active ? "#0FA7B5" : "#D9D9D9"}`,
                  background: active ? "#0FA7B5" : "transparent",
                  color: active ? "#fff" : "#8A8A8A",
                  borderRadius: 999,
                  padding: "8px 14px",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {a.label}
              </button>
            );
          })}
        </div>
        {payeeApp ? (
          <input
            style={{ ...input, marginTop: 10 }}
            value={payeeHandle}
            onChange={(e) => setPayeeHandle(e.target.value)}
            placeholder={payeeApp === "cashapp" ? "$cashtag" : "@username or phone"}
          />
        ) : null}
      </div>

      {msg ? (
        <p style={{ color: msg.ok ? "#34C759" : "#FF6B61", fontSize: 14, margin: 0, textAlign: "center" }}>{msg.text}</p>
      ) : null}

      <button
        onClick={save}
        disabled={saving}
        style={{
          background: "#0FA7B5",
          color: "#161616",
          border: "none",
          borderRadius: 12,
          padding: 14,
          fontSize: 16,
          fontWeight: 800,
          cursor: "pointer",
          opacity: saving ? 0.6 : 1,
        }}
      >
        {saving ? "Saving…" : "Save"}
      </button>

      {/* Rate history — private */}
      <div style={card}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={label}>RATE HISTORY</div>
          <span style={{ background: "#ECECEC", borderRadius: 999, padding: "2px 10px", fontSize: 10, fontWeight: 800, color: "#999", marginBottom: 6 }}>
            🔒 ONLY YOU
          </span>
        </div>
        <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>Built automatically from gigs paid through shabanga.</div>
        {gigs.length === 0 ? (
          <div style={{ color: "#8A8A8A", fontSize: 13, marginTop: 8 }}>
            No linked gigs yet — when a promoter links you on a cost, it lands here.
          </div>
        ) : (
          <>
            {gigs.map((g) => (
              <div key={g.costId} style={{ display: "flex", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #F1F0EC" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#161616" }}>{g.eventName}</div>
                  <div style={{ fontSize: 11, color: "#777", marginTop: 2 }}>
                    {g.organizerName} · {new Date(g.eventDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    {g.paidAt ? " · paid" : ""}
                  </div>
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#34C759" }}>${g.amount.toFixed(0)}</div>
              </div>
            ))}
            <div style={{ background: "#182418", borderRadius: 10, padding: 10, marginTop: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#34C759" }}>
                {year} so far: ${yearTotal.toFixed(0)} across {yearGigs.length} gig{yearGigs.length === 1 ? "" : "s"}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Toggle({ on, onChange, title, sub }: { on: boolean; onChange: (v: boolean) => void; title: string; sub: string }) {
  return (
    <button
      onClick={() => onChange(!on)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        width: "100%",
        background: "transparent",
        border: "none",
        padding: 0,
        marginTop: 16,
        cursor: "pointer",
        textAlign: "left",
      }}
    >
      <span style={{ flex: 1 }}>
        <span style={{ display: "block", fontSize: 15, fontWeight: 700, color: "#161616" }}>{title}</span>
        <span style={{ display: "block", fontSize: 12, marginTop: 2, color: on ? "#0FA7B5" : "#8A8A8A" }}>{sub}</span>
      </span>
      <span style={{ flexShrink: 0, width: 46, height: 28, borderRadius: 999, background: on ? "#0FA7B5" : "#D8D8D8", position: "relative", transition: "background 150ms" }}>
        <span style={{ position: "absolute", top: 3, left: on ? 21 : 3, width: 22, height: 22, borderRadius: 999, background: "#fff", transition: "left 150ms" }} />
      </span>
    </button>
  );
}

const card: React.CSSProperties = {
  background: "#FAFAFA",
  border: "none",
  borderRadius: 14,
  padding: 18,
};
const label: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: 1,
  color: "#8A8A8A",
  marginBottom: 6,
};
const input: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  border: "none",
  borderRadius: 10,
  padding: "11px 12px",
  fontSize: 15,
  background: "#F4F3EF",
  color: "#161616",
};
