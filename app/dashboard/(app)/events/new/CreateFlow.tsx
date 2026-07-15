"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

// Web mirror of the app's create flow (create/import-text, import-url,
// manual). describe/link run POST /events/import first and prefill the form;
// scratch goes straight to it. Create POSTs /events with doorsTime = start.

interface Prefilled {
  name?: string | null;
  description?: string | null;
  flyerUrl?: string | null;
  eventDate?: string | null;
  endTime?: string | null;
  capacity?: number | null;
  venueName?: string | null;
  venueAddress?: string | null;
  importSource?: string | null;
  importUrl?: string | null;
}

// ISO → value for <input type="datetime-local"> (local wall-clock, no seconds).
function toLocalInput(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const HEADERS: Record<string, { title: string; sub: string }> = {
  describe: {
    title: "Describe your event",
    sub: "Write it like you'd text a friend — date, time, capacity, starting price, whatever you know.",
  },
  link: { title: "Import from a link", sub: "Paste a Facebook or Partiful event URL." },
  scratch: { title: "Start from scratch", sub: "Enter the details manually." },
};

export function CreateFlow({ method }: { method: "describe" | "link" | "scratch" }) {
  const router = useRouter();
  const [step, setStep] = useState<"input" | "form">(method === "scratch" ? "form" : "input");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [importNote, setImportNote] = useState("");
  const [importMeta, setImportMeta] = useState<{ importSource?: string; importUrl?: string }>({});

  // Form state
  const [name, setName] = useState("");
  const [venueName, setVenueName] = useState("");
  const [venueAddress, setVenueAddress] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [capacity, setCapacity] = useState("");
  const [description, setDescription] = useState("");
  const [flyerUrl, setFlyerUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const applyPrefill = (p: Prefilled) => {
    if (p.name) setName(p.name);
    if (p.venueName) setVenueName(p.venueName);
    if (p.venueAddress) setVenueAddress(p.venueAddress);
    if (p.eventDate) setEventDate(toLocalInput(p.eventDate));
    if (p.endTime) setEndTime(toLocalInput(p.endTime));
    if (p.capacity) setCapacity(String(p.capacity));
    if (p.description) setDescription(p.description);
    if (p.flyerUrl) setFlyerUrl(p.flyerUrl);
    setImportMeta({
      ...(p.importSource ? { importSource: p.importSource } : {}),
      ...(p.importUrl ? { importUrl: p.importUrl } : {}),
    });
  };

  const runImport = async () => {
    setErr("");
    const body =
      method === "describe"
        ? {
            text: text.trim(),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            localTime: new Date().toString(),
          }
        : { url: url.trim() };
    if (method === "describe" && text.trim().length < 4) {
      setErr("Tell me a bit more about the event.");
      return;
    }
    if (method === "link" && !url.trim()) {
      setErr("Paste an event URL.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/dashboard/api/events/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(d.error || "Import failed. Try again, or start from scratch.");
        return;
      }
      applyPrefill(d.prefilled || {});
      if (d.message) setImportNote(d.message);
      setStep("form");
    } catch {
      setErr("Import failed. Try again, or start from scratch.");
    } finally {
      setBusy(false);
    }
  };

  // Flyer upload — same presigned S3 PUT the edit form uses.
  const onPickFlyer = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setErr("");
    setUploading(true);
    try {
      const contentType = file.type || "image/jpeg";
      const presign = await fetch(`/api/dashboard/api/events/upload-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType, kind: "flyer" }),
      });
      if (!presign.ok) throw new Error();
      const { uploadUrl, fileUrl } = await presign.json();
      const put = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": contentType },
        body: file,
      });
      if (!put.ok) throw new Error();
      setFlyerUrl(fileUrl);
    } catch {
      setErr("Flyer upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (!name.trim() || !venueName.trim() || !venueAddress.trim()) {
      setErr("Name, venue, and address are required.");
      return;
    }
    if (!eventDate) {
      setErr("Start date/time is required.");
      return;
    }
    if (!endTime) {
      setErr("End time is required.");
      return;
    }
    const cap = parseInt(capacity, 10);
    if (!Number.isFinite(cap) || cap <= 0) {
      setErr("Enter a valid capacity.");
      return;
    }
    setBusy(true);
    try {
      const startIso = new Date(eventDate).toISOString();
      const res = await fetch(`/api/dashboard/api/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          venueName: venueName.trim(),
          venueAddress: venueAddress.trim(),
          description: description.trim(),
          capacity: cap,
          eventDate: startIso,
          doorsTime: startIso, // doors == start (no separate doors concept)
          endTime: new Date(endTime).toISOString(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          ...(flyerUrl ? { flyerUrl } : {}),
          ...importMeta,
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(d.error || "Couldn't create the event. Try again.");
        setBusy(false);
        return;
      }
      router.push(`/dashboard/events/${d.id}`);
      router.refresh();
    } catch {
      setErr("Couldn't create the event. Try again.");
      setBusy(false);
    }
  };

  const h = HEADERS[method];

  return (
    <div style={{ maxWidth: 640 }}>
      <Link href="/dashboard/events" style={{ color: "#0B8896", fontWeight: 700, fontSize: 14 }}>
        ← Events
      </Link>
      <h1 style={{ fontSize: 24, fontWeight: 800, margin: "12px 0 4px", color: "#161616" }}>
        {step === "input" ? h.title : "Create event"}
      </h1>
      <p style={{ color: "#8A8A8A", fontSize: 14, margin: "0 0 18px" }}>
        {step === "input" ? h.sub : "Check the details, then create. It starts as a draft."}
      </p>

      {step === "input" ? (
        <div style={cardStyle}>
          {method === "describe" ? (
            <textarea
              style={{ ...input, minHeight: 120, resize: "vertical" }}
              placeholder={'e.g. "Warehouse party July 3, 9pm–3am at The Compound, 200 people, $20"'}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          ) : (
            <input
              style={input}
              placeholder="https://partiful.com/e/…"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          )}
          {err ? <p style={errText}>{err}</p> : null}
          <button onClick={runImport} disabled={busy} style={{ ...primaryBtn, marginTop: 14 }}>
            {busy ? "Working…" : method === "describe" ? "Draft my event" : "Import"}
          </button>
          <button onClick={() => setStep("form")} style={skipBtn}>
            Skip — fill in manually
          </button>
        </div>
      ) : (
        <form onSubmit={create} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {importNote ? <p style={{ ...errText, color: "#8A8A8A" }}>{importNote}</p> : null}
          <Field label="Event name">
            <input style={input} value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Venue name">
            <input style={input} value={venueName} onChange={(e) => setVenueName(e.target.value)} />
          </Field>
          <Field label="Venue address">
            <input style={input} value={venueAddress} onChange={(e) => setVenueAddress(e.target.value)} />
          </Field>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Field label="Start" style={{ flex: 1, minWidth: 200 }}>
              <input
                style={input}
                type="datetime-local"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
              />
            </Field>
            <Field label="End" style={{ flex: 1, minWidth: 200 }}>
              <input
                style={input}
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </Field>
          </div>
          <Field label="Capacity">
            <input
              style={input}
              inputMode="numeric"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value.replace(/[^0-9]/g, ""))}
            />
          </Field>
          <Field label="Description">
            <textarea
              style={{ ...input, minHeight: 90, resize: "vertical" }}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>
          <Field label="Flyer">
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {flyerUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={flyerUrl}
                  alt=""
                  width={56}
                  height={70}
                  style={{ borderRadius: 8, objectFit: "cover", background: "#ECECEC", flexShrink: 0 }}
                />
              ) : null}
              <label style={uploadLabel}>
                {uploading ? "Uploading…" : flyerUrl ? "Replace flyer" : "Upload flyer"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={onPickFlyer}
                  disabled={uploading}
                  style={{ display: "none" }}
                />
              </label>
              {flyerUrl && !uploading ? (
                <button type="button" onClick={() => setFlyerUrl(null)} style={removeLink}>
                  Remove
                </button>
              ) : null}
            </div>
          </Field>

          {err ? <p style={errText}>{err}</p> : null}

          <button type="submit" disabled={busy} style={primaryBtn}>
            {busy ? "Creating…" : "Create event"}
          </button>
          <p style={{ fontSize: 13, color: "#8A8A8A", margin: 0 }}>
            Next you&apos;ll add ticket types, then publish when it&apos;s ready.
          </p>
        </form>
      )}
    </div>
  );
}

function Field({
  label,
  children,
  style,
}: {
  label: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <label style={{ display: "block", ...style }}>
      <span
        style={{
          display: "block",
          fontSize: 12,
          fontWeight: 700,
          color: "#8A8A8A",
          textTransform: "uppercase",
          letterSpacing: 0.5,
          marginBottom: 6,
        }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

const cardStyle: React.CSSProperties = {
  background: "#FAFAFA",
  border: "none",
  borderRadius: 14,
  padding: 18,
};
const input: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  border: "none",
  borderRadius: 10,
  padding: "12px 14px",
  fontSize: 16,
  background: "#F4F3EF",
  color: "#161616",
};
const primaryBtn: React.CSSProperties = {
  width: "100%",
  background: "#0FA7B5",
  color: "#161616",
  border: "none",
  borderRadius: 12,
  padding: "13px",
  fontSize: 16,
  fontWeight: 700,
  cursor: "pointer",
};
const skipBtn: React.CSSProperties = {
  width: "100%",
  marginTop: 8,
  background: "transparent",
  color: "#8A8A8A",
  border: "none",
  padding: "10px",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
};
const uploadLabel: React.CSSProperties = {
  display: "inline-block",
  background: "#F4F3EF",
  color: "#161616",
  border: "none",
  borderRadius: 10,
  padding: "10px 16px",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
};
const removeLink: React.CSSProperties = {
  background: "transparent",
  color: "#8A8A8A",
  border: "none",
  fontSize: 13,
  cursor: "pointer",
};
const errText: React.CSSProperties = { color: "#C0322B", fontSize: 13, margin: "10px 0 0" };
