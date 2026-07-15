"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

const AI = "#0FA7B5"; // brand yellow — AI accent
const AI_BG = "#161616"; // dark AI card (on-brand dark+yellow)
const INK = "#161616"; // readable link / text color

interface PickEvent {
  id: string;
  name: string;
  venueName: string;
  eventDate: string;
  status: string;
  flyerUrl?: string | null;
}
interface Blast {
  id: string;
  subject: string;
  recipientCount: number;
  createdAt: string;
}

const newKey = () =>
  `blast-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const TONES = [
  { tone: "punchier", label: "Punchier" },
  { tone: "shorter and tighter", label: "Shorter" },
  { tone: "more hyped up", label: "More hype" },
  { tone: "more polished and professional", label: "Polished" },
];

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

export default function MarketingComposer() {
  const [recipientCount, setRecipientCount] = useState(0);
  const [history, setHistory] = useState<Blast[]>([]);
  const [events, setEvents] = useState<PickEvent[]>([]);
  const [loaded, setLoaded] = useState(false);

  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [face, setFace] = useState("happy");
  const [theme, setTheme] = useState("teal"); // email colorway (matches the show's vibe)
  const [featuredIds, setFeaturedIds] = useState<string[]>([]);
  const [lastTemplate, setLastTemplate] = useState<string | null>(null);
  const [aiPrompt, setAiPrompt] = useState("");
  const [drafting, setDrafting] = useState(false);
  const [rewriting, setRewriting] = useState<string | null>(null);
  const [subjectOptions, setSubjectOptions] = useState<string[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [idemKey, setIdemKey] = useState(newKey());
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [bRes, eRes] = await Promise.all([
        fetch("/api/dashboard/blasts"),
        fetch("/api/dashboard/events"),
      ]);
      const b = await bRes.json().catch(() => ({}));
      setRecipientCount(b.recipientCount ?? 0);
      setHistory(b.blasts ?? []);
      const ev = await eRes.json().catch(() => []);
      const now = Date.now();
      setEvents(
        (Array.isArray(ev) ? ev : [])
          .filter((e: PickEvent) => e.status === "published" && new Date(e.eventDate).getTime() > now)
          .sort((a: PickEvent, b2: PickEvent) => +new Date(a.eventDate) - +new Date(b2.eventDate)),
      );
    } finally {
      setLoaded(true);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const orderedShows = (ids: string[]) =>
    ids.map((id) => events.find((e) => e.id === id)).filter(Boolean) as PickEvent[];
  const selectedShows = orderedShows(featuredIds);

  const applyTemplate = (kind: string, showsOverride?: PickEvent[]) => {
    const shows = showsOverride !== undefined ? showsOverride : selectedShows;
    const one = shows.length === 1 ? shows[0] : null;
    const many = shows.length > 1;
    const detail = one
      ? `${one.name} on ${fmtDate(one.eventDate)}${one.venueName ? ` at ${one.venueName}` : ""}`
      : "";
    if (kind === "newShow") {
      setSubject(many ? "New shows just dropped 🎉" : one ? `New show: ${one.name} 🎉` : "New show just dropped 🎉");
      setBody(
        many
          ? "Hey! I've got new shows coming up — here's the lineup. Grab tickets below before they're gone.\n\n"
          : one
            ? `Hey! I just announced ${detail}. Wanted you to be the first to know — grab tickets below before they're gone.\n\n`
            : "Hey! I just announced a new show and wanted you to be the first to know. Tap below to grab tickets before they're gone.\n\n",
      );
      setFace("happy");
    } else if (kind === "lastChance") {
      setSubject(one ? `Last chance: ${one.name} 🔥` : "Last chance for tickets 🔥");
      setBody(
        many
          ? "Tickets are moving fast for these. Don't sleep on it — grab yours below.\n\n"
          : one
            ? `Tickets for ${detail} are almost gone. Don't sleep on it — grab yours below.\n\n`
            : "Tickets are almost gone for the next one. Don't sleep on it — grab yours below.\n\n",
      );
      setFace("excited");
    } else {
      setSubject("Thanks for coming out 🙌");
      setBody(
        many || one
          ? `Thank you for being part of the last show — it meant a lot. Here's what's next${one ? `: ${detail}` : ""}. Grab tickets below.\n\n`
          : "Thank you for being part of the last show — it meant a lot. Here's what's coming up next.\n\n",
      );
      setFace("love");
    }
    setLastTemplate(kind);
  };

  const toggleShow = (id: string) => {
    const next = featuredIds.includes(id) ? featuredIds.filter((x) => x !== id) : [...featuredIds, id];
    setFeaturedIds(next);
    if (lastTemplate) applyTemplate(lastTemplate, orderedShows(next));
  };
  const addAll = () => {
    const ids = events.map((e) => e.id);
    setFeaturedIds(ids);
    if (lastTemplate) applyTemplate(lastTemplate, events);
  };

  const callDraft = async (payload: object) => {
    const res = await fetch("/api/dashboard/blasts/draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, featuredEventIds: featuredIds }),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error || "AI error");
    return res.json();
  };
  const handleDraft = async () => {
    setDrafting(true);
    setMsg(null);
    try {
      const d = await callDraft({ prompt: aiPrompt.trim() });
      setSubject(d.subject);
      setBody(d.body?.endsWith("\n") ? d.body : `${d.body}\n\n`);
      setLastTemplate(null);
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setDrafting(false);
    }
  };
  const handleRewrite = async (tone: string) => {
    if (!body.trim()) return;
    setRewriting(tone);
    setMsg(null);
    try {
      const d = await callDraft({ mode: "rewrite", tone, subject, body });
      setSubject(d.subject);
      setBody(d.body?.endsWith("\n") ? d.body : `${d.body}\n\n`);
      setLastTemplate(null);
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setRewriting(null);
    }
  };
  const handleSubjects = async () => {
    if (!body.trim()) return;
    setLoadingSubjects(true);
    setMsg(null);
    try {
      const d = await callDraft({ mode: "subjects", subject, body });
      setSubjectOptions(d.subjects ?? []);
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setLoadingSubjects(false);
    }
  };

  const send = async () => {
    if (!subject.trim() || !body.trim()) {
      setMsg("Add a subject and message first.");
      return;
    }
    if (recipientCount === 0) {
      setMsg("No fans yet — no one has bought a ticket to your shows.");
      return;
    }
    if (!confirm(`Send to ${recipientCount} ${recipientCount === 1 ? "person" : "people"}?`)) return;
    setSending(true);
    setMsg(null);
    try {
      const res = await fetch("/api/dashboard/blasts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subject.trim(),
          body: body.trim(),
          featuredEventIds: featuredIds,
          idempotencyKey: idemKey,
          face,
          theme,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(data.error || "Couldn't send.");
        return;
      }
      setMsg(`Sent to ${data.sent} ${data.sent === 1 ? "person" : "people"}.`);
      setSubject("");
      setBody("");
      setFace("happy");
      setFeaturedIds([]);
      setLastTemplate(null);
      setAiPrompt("");
      setSubjectOptions([]);
      setIdemKey(newKey());
      load();
    } finally {
      setSending(false);
    }
  };

  const input: React.CSSProperties = {
    width: "100%",
    boxSizing: "border-box",
    border: "none",
    borderRadius: 10,
    padding: "12px 14px",
    fontSize: 15,
    fontFamily: "inherit",
    background: "#F4F3EF",
    color: "#161616",
  };
  const chip: React.CSSProperties = {
    border: "none",
    background: "#F4F3EF",
    color: "#333333",
    borderRadius: 999,
    padding: "7px 14px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  };

  return (
    <div style={{ maxWidth: 640 }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, margin: "12px 0 4px" }}>Email your fans</h1>
      <p style={{ color: "#8A8A8A", fontSize: 14, margin: "0 0 4px" }}>
        {!loaded
          ? "Counting your fans…"
          : recipientCount === 0
            ? "No fans yet — they appear once people buy tickets to your shows."
            : `${recipientCount} ${recipientCount === 1 ? "fan" : "fans"} across all your shows will get this (deduped, minus unsubscribes).`}
      </p>

      {/* templates */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "16px 0" }}>
        {[
          { k: "newShow", label: "New show" },
          { k: "lastChance", label: "Last chance" },
          { k: "thanks", label: "Thanks" },
        ].map((t) => (
          <button key={t.k} style={chip} onClick={() => applyTemplate(t.k)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* AI card */}
      <div style={{ background: AI_BG, borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <div style={{ fontWeight: 800, color: AI, marginBottom: 8 }}>✨ Draft with AI</div>
        <textarea
          style={{ ...input, minHeight: 60, background: "#F4F3EF" }}
          placeholder="Tell Stub what to say — e.g. 'hype my Friday warehouse show, doors 10pm'"
          value={aiPrompt}
          onChange={(e) => setAiPrompt(e.target.value)}
        />
        <button
          onClick={handleDraft}
          disabled={drafting}
          style={{ marginTop: 8, width: "100%", background: AI, color: "#161616", border: "none", borderRadius: 10, padding: 12, fontWeight: 700, fontSize: 15, cursor: "pointer" }}
        >
          {drafting ? "Drafting…" : "✨ Draft it"}
        </button>
        {body.trim() && (
          <>
            <div style={{ fontSize: 12, fontWeight: 700, color: AI, textTransform: "uppercase", letterSpacing: 0.5, margin: "14px 0 6px" }}>
              Adjust tone
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {TONES.map((t) => (
                <button
                  key={t.tone}
                  disabled={!!rewriting}
                  onClick={() => handleRewrite(t.tone)}
                  style={{ ...chip, background: "transparent", borderColor: AI, color: AI }}
                >
                  {rewriting === t.tone ? "…" : t.label}
                </button>
              ))}
            </div>
            <button
              onClick={handleSubjects}
              disabled={loadingSubjects}
              style={{ marginTop: 10, width: "100%", background: "transparent", color: AI, border: `1.5px solid ${AI}`, borderRadius: 10, padding: 10, fontWeight: 700, cursor: "pointer" }}
            >
              {loadingSubjects ? "Thinking…" : "💡 Subject ideas"}
            </button>
            {subjectOptions.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
                {subjectOptions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setSubject(s);
                      setSubjectOptions([]);
                    }}
                    style={{ textAlign: "left", background: "#F4F3EF", color: "#161616", border: "none", borderRadius: 10, padding: "10px 12px", fontSize: 14, cursor: "pointer" }}
                  >
                    ↑ {s}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <input
        style={{ ...input, marginBottom: 10 }}
        placeholder="Subject"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
      />
      <textarea
        style={{ ...input, minHeight: 160 }}
        placeholder="Your message…"
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />

      {/* email theme — colorway for the header + buttons */}
      <div style={{ fontSize: 13, fontWeight: 700, color: "#8A8A8A", textTransform: "uppercase", letterSpacing: 0.5, margin: "16px 0 8px" }}>
        Email theme
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 4 }}>
        {[
          { k: "teal", c: "#0FA7B5", label: "Teal" },
          { k: "night", c: "#161616", label: "Night" },
          { k: "amber", c: "#F5A623", label: "Amber" },
          { k: "sunset", c: "#FF7052", label: "Sunset" },
          { k: "ember", c: "#3A2A16", label: "Ember" },
          { k: "acid", c: "#B7F34D", label: "Acid" },
          { k: "og", c: "#F5E642", label: "OG" },
        ].map((t) => (
          <button
            key={t.k}
            onClick={() => setTheme(t.k)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              borderRadius: 999,
              padding: "7px 12px",
              fontSize: 13,
              fontWeight: theme === t.k ? 800 : 600,
              border: "none",
              cursor: "pointer",
              background: theme === t.k ? "#161616" : "#F4F3EF",
              color: theme === t.k ? "#fff" : "#555",
            }}
          >
            <span style={{ width: 12, height: 12, borderRadius: 6, background: t.c, border: "1px solid rgba(0,0,0,0.15)" }} />
            {t.label}
          </button>
        ))}
      </div>

      {/* feature shows */}
      <div style={{ fontSize: 13, fontWeight: 700, color: "#8A8A8A", textTransform: "uppercase", letterSpacing: 0.5, margin: "16px 0 8px" }}>
        Feature shows{selectedShows.length ? ` (${selectedShows.length})` : ""}
      </div>
      {events.length > 0 && (
        <button onClick={addAll} style={{ ...chip, marginBottom: 8, background: "#FBF6DA", borderColor: "#EFE7C2" }}>
          + Add all upcoming ({events.length})
        </button>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {events.map((e) => {
          const on = featuredIds.includes(e.id);
          return (
            <button
              key={e.id}
              onClick={() => toggleShow(e.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: on ? "#FBF6DA" : "#FAFAFA",
                border: `1px solid ${on ? "#EFE7C2" : "#E5E5E5"}`,
                borderRadius: 10,
                padding: "10px 12px",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <span style={{ color: on ? INK : "#8A8A8A", fontWeight: 800 }}>{on ? "☑" : "☐"}</span>
              <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: on ? "#161616" : "#333333" }}>{e.name}</span>
              <span style={{ fontSize: 12, color: on ? "#6B6B57" : "#8A8A8A" }}>{fmtDate(e.eventDate)}</span>
            </button>
          );
        })}
      </div>

      <button
        onClick={send}
        disabled={sending}
        style={{ width: "100%", marginTop: 20, background: "#0FA7B5", color: "#161616", border: "none", borderRadius: 10, padding: 14, fontSize: 16, fontWeight: 700, cursor: "pointer" }}
      >
        {sending ? "Sending…" : "Send email"}
      </button>
      {msg ? <p style={{ textAlign: "center", color: "#8A8A8A", fontSize: 14, marginTop: 10 }}>{msg}</p> : null}
      <p style={{ textAlign: "center", color: "#8A8A8A", fontSize: 12, marginTop: 10, lineHeight: 1.5 }}>
        Marketing email — every message includes a one-click unsubscribe. Use it to promote shows.
      </p>

      {history.length > 0 && (
        <>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#8A8A8A", textTransform: "uppercase", letterSpacing: 0.5, margin: "24px 0 8px" }}>
            Sent
          </div>
          {history.map((b) => (
            <div key={b.id} style={{ background: "#FAFAFA", border: "none", borderRadius: 10, padding: 12, marginBottom: 8 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{b.subject}</div>
              <div style={{ fontSize: 12, color: "#8A8A8A" }}>
                {new Date(b.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })} ·{" "}
                {b.recipientCount} {b.recipientCount === 1 ? "recipient" : "recipients"}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
