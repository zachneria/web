"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export interface EditableEvent {
  id: string;
  name: string;
  venueName: string;
  venueAddress: string;
  description?: string;
  capacity: number;
  eventDate: string;
  endTime?: string | null;
  flyerUrl?: string | null;
}

// ISO → value for <input type="datetime-local"> (local wall-clock, no seconds).
function toLocalInput(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EditForm({ event, soldCount = 0 }: { event: EditableEvent; soldCount?: number }) {
  const router = useRouter();
  const [name, setName] = useState(event.name);
  const [venueName, setVenueName] = useState(event.venueName);
  const [venueAddress, setVenueAddress] = useState(event.venueAddress);
  const [capacity, setCapacity] = useState(String(event.capacity ?? ""));
  const [description, setDescription] = useState(event.description ?? "");
  const [eventDate, setEventDate] = useState(toLocalInput(event.eventDate));
  const [endTime, setEndTime] = useState(toLocalInput(event.endTime));
  const [flyerUrl, setFlyerUrl] = useState<string | null>(event.flyerUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  // Flyer upload — mirrors the app: presigned S3 PUT (POST /events/upload-url →
  // { uploadUrl, fileUrl }, then PUT the bytes straight to S3; bucket CORS allows it).
  const onPickFlyer = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file
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

  const save = async (e: React.FormEvent) => {
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
    const cap = parseInt(capacity, 10);
    if (!Number.isFinite(cap) || cap <= 0) {
      setErr("Enter a valid capacity.");
      return;
    }
    setBusy(true);
    try {
      const startIso = new Date(eventDate).toISOString();
      const res = await fetch(`/api/dashboard/api/events/${event.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          venueName: venueName.trim(),
          venueAddress: venueAddress.trim(),
          description: description.trim(),
          capacity: cap,
          eventDate: startIso,
          doorsTime: startIso, // doors == start (no separate doors concept)
          endTime: endTime ? new Date(endTime).toISOString() : null,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          flyerUrl, // null clears it
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setErr(d.error || "Couldn't save. Try again.");
        setBusy(false);
        return;
      }
      // Time moved on an event people already hold tickets to? Offer the
      // Message page (announce) on the way out.
      const origStart = new Date(event.eventDate).getTime();
      const origEnd = event.endTime ? new Date(event.endTime).getTime() : null;
      const newStart = new Date(eventDate).getTime();
      const newEnd = endTime ? new Date(endTime).getTime() : null;
      if (soldCount > 0 && (newStart !== origStart || newEnd !== origEnd)) {
        if (
          window.confirm(
            `Saved. ${soldCount} ${soldCount === 1 ? "person already has a ticket" : "people already have tickets"} — message them about the new time?`,
          )
        ) {
          router.push(`/dashboard/events/${event.id}/message`);
          router.refresh();
          return;
        }
      }
      router.push(`/dashboard/events/${event.id}`);
      router.refresh();
    } catch {
      setErr("Couldn't save. Try again.");
      setBusy(false);
    }
  };

  const cancelEvent = async () => {
    if (
      !window.confirm(
        "Cancel this event? Ticket sales stop immediately. This can't be undone.",
      )
    )
      return;
    setBusy(true);
    setErr("");
    try {
      const res = await fetch(`/api/dashboard/api/events/${event.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setErr(d.error || "Couldn't cancel. Try again.");
        setBusy(false);
        return;
      }
      router.push(`/dashboard/events/${event.id}`);
      router.refresh();
    } catch {
      setErr("Couldn't cancel. Try again.");
      setBusy(false);
    }
  };

  return (
    <form onSubmit={save} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
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
        <Field label="End (optional)" style={{ flex: 1, minWidth: 200 }}>
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
              style={{ borderRadius: 8, objectFit: "cover", background: "#F4F3EF", flexShrink: 0 }}
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

      {err ? <p style={{ color: "#C0322B", fontSize: 13, margin: 0 }}>{err}</p> : null}

      <button
        type="submit"
        disabled={busy}
        style={{
          background: "#0FA7B5",
          color: "#161616",
          border: "none",
          borderRadius: 12,
          padding: "13px",
          fontSize: 16,
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        {busy ? "Saving…" : "Save changes"}
      </button>

      <button
        type="button"
        onClick={cancelEvent}
        disabled={busy}
        style={{
          marginTop: 4,
          background: "transparent",
          color: "#C0322B",
          border: "1.5px solid #C0322B",
          borderRadius: 12,
          padding: "13px",
          fontSize: 15,
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        Cancel event
      </button>
    </form>
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
