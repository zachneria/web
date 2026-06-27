"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const VALID_HANDLE = /^[a-z0-9-]{3,30}$/;

export default function PromoterSettings() {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [savedHandle, setSavedHandle] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [savingHandle, setSavingHandle] = useState(false);
  const [handleMsg, setHandleMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [logoBusy, setLogoBusy] = useState(false);
  const [logoMsg, setLogoMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/dashboard/profile");
        const d = await res.json().catch(() => ({}));
        setLogoUrl(d.logoUrl ?? null);
        setName(d.name ?? "");
        setSavedHandle(d.handle ?? null);
        setHandle(d.handle ?? "");
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

  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoBusy(true);
    setLogoMsg(null);
    try {
      const res = await fetch("/api/dashboard/logo", {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setLogoMsg(d.error || "Upload failed.");
        return;
      }
      setLogoUrl(d.logoUrl);
    } finally {
      setLogoBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const removeLogo = async () => {
    setLogoBusy(true);
    setLogoMsg(null);
    try {
      const res = await fetch("/api/dashboard/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logoUrl: null }),
      });
      if (res.ok) setLogoUrl(null);
    } finally {
      setLogoBusy(false);
    }
  };

  const card: React.CSSProperties = {
    background: "#fff",
    border: "1px solid #eee",
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
  };

  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      <Link href="/dashboard" style={{ color: "#6C5CE7", fontWeight: 700, fontSize: 14 }}>
        ← Dashboard
      </Link>
      <h1 style={{ fontSize: 24, fontWeight: 800, margin: "12px 0 18px" }}>Promoter Settings</h1>

      {!loaded ? (
        <p style={{ color: "#999" }}>Loading…</p>
      ) : (
        <>
          {/* Logo */}
          <div style={{ ...card, textAlign: "center" }}>
            <div style={{ marginBottom: 14 }}>
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt=""
                  width={96}
                  height={96}
                  style={{ borderRadius: "50%", objectFit: "cover", border: "3px solid #F5E642", background: "#fff" }}
                />
              ) : (
                <div
                  style={{
                    width: 96,
                    height: 96,
                    borderRadius: "50%",
                    background: "#F5E642",
                    color: "#000",
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
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={onPickFile}
              style={{ display: "none" }}
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={logoBusy}
              style={btn}
            >
              {logoBusy ? "Uploading…" : logoUrl ? "Change logo" : "Add your logo"}
            </button>
            {logoUrl && !logoBusy ? (
              <button onClick={removeLogo} style={{ ...btnGhost, marginLeft: 8 }}>
                Remove
              </button>
            ) : null}
            <p style={{ fontSize: 12, color: "#999", marginTop: 10 }}>Square PNG, JPEG, or WebP.</p>
            {logoMsg ? <p style={{ color: "#C0322B", fontSize: 13, marginTop: 6 }}>{logoMsg}</p> : null}
          </div>

          {/* Promoter page handle */}
          <div style={card}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
              Your promoter page
            </div>
            <div style={{ display: "flex", alignItems: "center", border: "1px solid #e2e2e2", borderRadius: 10, overflow: "hidden" }}>
              <span style={{ padding: "12px 8px 12px 12px", color: "#999", fontSize: 15, whiteSpace: "nowrap" }}>
                fansonly.live/p/
              </span>
              <input
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="your-name"
                style={{ flex: 1, border: "none", outline: "none", padding: "12px 12px 12px 0", fontSize: 15 }}
              />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12 }}>
              <button onClick={saveHandle} disabled={savingHandle} style={btn}>
                {savingHandle ? "Saving…" : "Save"}
              </button>
              {savedHandle ? (
                <a
                  href={`https://fansonly.live/p/${savedHandle}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: "#6C5CE7", fontWeight: 600, fontSize: 14 }}
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
        </>
      )}
    </div>
  );
}

const btn: React.CSSProperties = {
  background: "#F5E642",
  color: "#000",
  border: "none",
  borderRadius: 10,
  padding: "10px 18px",
  fontWeight: 700,
  fontSize: 14,
  cursor: "pointer",
};
const btnGhost: React.CSSProperties = {
  background: "transparent",
  color: "#C0322B",
  border: "1.5px solid #f0c5c2",
  borderRadius: 10,
  padding: "10px 18px",
  fontWeight: 700,
  fontSize: 14,
  cursor: "pointer",
};
