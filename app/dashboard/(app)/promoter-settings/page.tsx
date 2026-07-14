"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { cleanHandleInput } from "@/lib/handle-input";

const VALID_HANDLE = /^[a-z0-9-]{3,30}$/;

export default function PromoterSettings() {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [savedHandle, setSavedHandle] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [savingHandle, setSavingHandle] = useState(false);
  const [handleMsg, setHandleMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [promoterName, setPromoterName] = useState("");
  const [bio, setBio] = useState("");
  const [ig, setIg] = useState("");
  const [fb, setFb] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/dashboard/profile");
        const d = await res.json().catch(() => ({}));
        setLogoUrl(d.logoUrl ?? null);
        setName(d.name ?? "");
        setSavedHandle(d.handle ?? null);
        setHandle(d.handle ?? "");
        setPromoterName(d.promoterName ?? "");
        setBio(d.bio ?? "");
        setIg(d.links?.instagram ?? "");
        setFb(d.links?.facebook ?? "");
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const saveHandle = async () => {
    const h = handle.trim().toLowerCase();
    if (h !== "" && !VALID_HANDLE.test(h)) {
      setHandleMsg({ ok: false, text: "3–30 chars: lowercase letters, numbers, hyphens." });
      return;
    }
    if (
      savedHandle &&
      h &&
      h !== savedHandle &&
      !window.confirm(
        `Change your link? shabanga.com/p/${savedHandle} will stop working — anything printed or posted with it breaks.`,
      )
    ) {
      return;
    }
    setSavingHandle(true);
    setHandleMsg(null);
    try {
      const res = await fetch("/api/dashboard/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle: h === "" ? null : h }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setHandleMsg({ ok: false, text: d.error || "Couldn't save." });
        return;
      }
      setSavedHandle(d.handle ?? null);
      setHandle(d.handle ?? "");
      setHandleMsg({ ok: true, text: d.handle ? "Saved — your page is live." : "Link removed." });
    } finally {
      setSavingHandle(false);
    }
  };

  const saveProfile = async () => {
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      const res = await fetch("/api/dashboard/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promoterName: promoterName.trim() || null,
          bio: bio.trim() || null,
          links: { instagram: ig.trim() || null, facebook: fb.trim() || null },
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setProfileMsg({ ok: false, text: d.error || "Couldn't save." });
        return;
      }
      // Reflect the server's normalization (@handle -> full URL).
      setPromoterName(d.promoterName ?? "");
      setBio(d.bio ?? "");
      setIg(d.links?.instagram ?? "");
      setFb(d.links?.facebook ?? "");
      setProfileMsg({ ok: true, text: "Saved — it shows on your promoter page." });
    } finally {
      setSavingProfile(false);
    }
  };

  const card: React.CSSProperties = {
    background: "#FAFAFA",
    border: "none",
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
  };

  return (
    <div style={{ maxWidth: 640 }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, margin: "12px 0 18px" }}>Promoter Settings</h1>

      {!loaded ? (
        <p style={{ color: "#8A8A8A" }}>Loading…</p>
      ) : (
        <>
          {/* Logo (display only — upload your logo in the shabanga app) */}
          <div style={{ ...card, textAlign: "center" }}>
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt=""
                width={96}
                height={96}
                style={{ borderRadius: "50%", objectFit: "cover", border: "3px solid #F5E642", background: "#FAFAFA" }}
              />
            ) : (
              <div
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: "50%",
                  background: "#F5E642",
                  color: "#191D33",
                  fontSize: 40,
                  fontWeight: 800,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto",
                }}
              >
                {(name || "?").charAt(0).toUpperCase()}
              </div>
            )}
            <p style={{ fontSize: 13, color: "#8A8A8A", marginTop: 12 }}>
              {logoUrl ? "Your logo." : "No logo yet."} Upload or change it in the shabanga app.
            </p>
          </div>

          {/* Promoter page handle */}
          <div style={card}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#8A8A8A", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
              Your promoter page
            </div>
            <div style={{ display: "flex", alignItems: "center", border: "none", borderRadius: 10, overflow: "hidden", background: "#F4F3EF" }}>
              <span style={{ padding: "12px 8px 12px 12px", color: "#8A8A8A", fontSize: 15, whiteSpace: "nowrap" }}>
                shabanga.com/p/
              </span>
              <input
                value={handle}
                onChange={(e) => {
                  const { value, warning } = cleanHandleInput(e.target.value);
                  setHandle(value);
                  setHandleMsg(warning ? { ok: false, text: warning } : null);
                }}
                placeholder="your-name"
                style={{ flex: 1, border: "none", outline: "none", padding: "12px 12px 12px 0", fontSize: 15, background: "transparent", color: "#22243A" }}
              />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12 }}>
              <button onClick={saveHandle} disabled={savingHandle} style={btn}>
                {savingHandle ? "Saving…" : "Save"}
              </button>
              {savedHandle ? (
                <a
                  href={`https://shabanga.com/p/${savedHandle}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: "#0B8896", fontWeight: 600, fontSize: 14 }}
                >
                  View page ↗
                </a>
              ) : null}
            </div>
            {handleMsg ? (
              <p style={{ color: handleMsg.ok ? "#1B873F" : "#C0322B", fontSize: 13, marginTop: 8 }}>
                {handleMsg.text}
              </p>
            ) : null}
          </div>

          {/* Public profile — bio + socials, shown on the /p page (mirrors the
              artist settings pattern, promoter flavor). */}
          <div style={card}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#8A8A8A", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
              About your crew
            </div>
            <label style={fieldLabel}>Promotion name</label>
            <input
              value={promoterName}
              onChange={(e) => setPromoterName(e.target.value)}
              placeholder="e.g. Neria Presents"
              maxLength={80}
              style={inputStyle}
            />
            <p style={{ fontSize: 12, color: "#8A8A8A", margin: "6px 0 10px" }}>
              Shown publicly on your page and event listings — instead of your account name.
            </p>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Who you are, what you throw, what people should expect…"
              maxLength={600}
              style={{ ...inputStyle, minHeight: 90, resize: "vertical" }}
            />
            <label style={fieldLabel}>Instagram</label>
            <input
              value={ig}
              onChange={(e) => setIg(e.target.value)}
              placeholder="@yourcrew or full URL"
              style={inputStyle}
            />
            <label style={fieldLabel}>Facebook</label>
            <input
              value={fb}
              onChange={(e) => setFb(e.target.value)}
              placeholder="facebook.com/yourcrew"
              style={inputStyle}
            />
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 14 }}>
              <button onClick={saveProfile} disabled={savingProfile} style={btn}>
                {savingProfile ? "Saving…" : "Save"}
              </button>
              {profileMsg ? (
                <span style={{ color: profileMsg.ok ? "#1B873F" : "#C0322B", fontSize: 13 }}>
                  {profileMsg.text}
                </span>
              ) : null}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  border: "none",
  borderRadius: 10,
  padding: "11px 12px",
  fontSize: 15,
  background: "#F4F3EF",
  color: "#22243A",
};
const fieldLabel: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  fontWeight: 700,
  color: "#8A8A8A",
  margin: "10px 0 4px",
};
const btn: React.CSSProperties = {
  background: "#F5E642",
  color: "#191D33",
  border: "none",
  borderRadius: 10,
  padding: "10px 18px",
  fontWeight: 700,
  fontSize: 14,
  cursor: "pointer",
};
