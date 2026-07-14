"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

// Organizers + Tiers & caps, combined (the app splits these into two screens;
// web has the room). Top: the guest-pass tier ladder. Below: invite + the
// organizer list with per-organizer tier / fee-waiver / Pro / Talent chips.

interface Tier {
  level: number;
  name: string;
  guestCap: number;
}
interface EditTier {
  level: number;
  name: string;
  guestCap: string; // input-friendly
}
interface Organizer {
  sub: string;
  email: string;
  name: string;
  status: string; // FORCE_CHANGE_PASSWORD until they set a password
  enabled: boolean;
  createdAt: string;
  tier: number;
  platformFeeRate: number | null; // null = default scale; 0 = waived
  isPro: boolean;
  isTalent: boolean;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const api = (path: string, init?: RequestInit) =>
  fetch(`/api/dashboard/api/users/admin/${path}`, init);
const put = (path: string, body: unknown) =>
  api(path, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

export default function AdminOrganizers() {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Saved tiers drive the per-organizer chips; editTiers is the editor's copy.
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [editTiers, setEditTiers] = useState<EditTier[]>([]);
  const [savingTiers, setSavingTiers] = useState(false);
  const [tiersMsg, setTiersMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [organizers, setOrganizers] = useState<Organizer[]>([]);

  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [search, setSearch] = useState("");
  const [resends, setResends] = useState<Record<string, "sending" | "sent">>({});

  const load = useCallback(async () => {
    try {
      const [orgRes, cfgRes] = await Promise.all([api("organizers"), api("config")]);
      const orgData = await orgRes.json().catch(() => ({}));
      const cfg = await cfgRes.json().catch(() => ({}));
      if (!orgRes.ok) {
        setError(orgData.error || "Couldn't load organizers.");
        return;
      }
      setOrganizers(orgData.organizers ?? []);
      const list: Tier[] =
        cfg.tiers && cfg.tiers.length > 0
          ? cfg.tiers
          : [
              { level: 1, name: "Tier 1", guestCap: cfg.guestCapTier1 ?? 16 },
              { level: 2, name: "Tier 2", guestCap: cfg.guestCapTier2 ?? 24 },
            ];
      const sorted = list.slice().sort((a, b) => a.level - b.level);
      setTiers(sorted);
      setEditTiers(sorted.map((t) => ({ ...t, guestCap: String(t.guestCap) })));
    } catch {
      setError("Couldn't load organizers.");
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // ---- Tier editor ----

  const updateTier = (i: number, patch: Partial<EditTier>) => {
    setEditTiers((ts) => ts.map((t, idx) => (idx === i ? { ...t, ...patch } : t)));
    setTiersMsg(null);
  };
  const addTier = () => {
    const nextLevel = editTiers.reduce((m, t) => Math.max(m, t.level), 0) + 1;
    setEditTiers((ts) => [...ts, { level: nextLevel, name: `Tier ${nextLevel}`, guestCap: "0" }]);
    setTiersMsg(null);
  };
  const removeTier = (i: number) => {
    setEditTiers((ts) => ts.filter((_, idx) => idx !== i));
    setTiersMsg(null);
  };

  const saveTiers = async () => {
    setTiersMsg(null);
    const parsed: Tier[] = [];
    for (const t of editTiers) {
      const name = t.name.trim();
      const cap = Number(t.guestCap);
      if (!name) return setTiersMsg({ ok: false, text: "Every tier needs a name." });
      if (!Number.isInteger(cap) || cap < 0)
        return setTiersMsg({ ok: false, text: `"${name}" needs a whole-number guest cap ≥ 0.` });
      parsed.push({ level: t.level, name, guestCap: cap });
    }
    setSavingTiers(true);
    try {
      const res = await put("config", { tiers: parsed });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setTiersMsg({ ok: false, text: d.error || "Couldn't save tiers." });
        return;
      }
      setTiers(parsed);
      setTiersMsg({ ok: true, text: "Saved ✓" });
    } catch {
      setTiersMsg({ ok: false, text: "Couldn't save tiers." });
    } finally {
      setSavingTiers(false);
    }
  };

  // ---- Invite ----

  const invite = async () => {
    const n = inviteName.trim();
    const e = inviteEmail.trim().toLowerCase();
    setInviteMsg(null);
    if (n.length < 2) return setInviteMsg({ ok: false, text: "Enter the organizer's name." });
    if (!EMAIL_RE.test(e)) return setInviteMsg({ ok: false, text: "Enter a valid email." });
    setInviting(true);
    try {
      const res = await api("organizers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: n, email: e }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setInviteMsg({ ok: false, text: d.error || "Couldn't send the invite." });
        return;
      }
      setInviteMsg({ ok: true, text: `Invite emailed to ${e} ✓` });
      setInviteName("");
      setInviteEmail("");
      await load();
    } catch {
      setInviteMsg({ ok: false, text: "Couldn't send the invite." });
    } finally {
      setInviting(false);
    }
  };

  // ---- Per-organizer chips (optimistic; reload on failure) ----

  const patchOrganizer = async (sub: string, local: Partial<Organizer>, req: Promise<Response>) => {
    setOrganizers((os) => os.map((o) => (o.sub === sub ? { ...o, ...local } : o)));
    try {
      const res = await req;
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error || "Couldn't save — reloaded.");
        load();
      }
    } catch {
      setError("Couldn't save — reloaded.");
      load();
    }
  };

  const changeTier = (sub: string, tier: number) =>
    patchOrganizer(sub, { tier }, put("organizer-tier", { sub, tier }));
  const changeFee = (sub: string, platformFeeRate: number | null) =>
    patchOrganizer(sub, { platformFeeRate }, put("organizer-fee", { sub, platformFeeRate }));
  const changePro = (sub: string, isPro: boolean) =>
    patchOrganizer(sub, { isPro }, put("organizer-pro", { sub, isPro }));
  const changeTalent = (sub: string, isTalent: boolean) =>
    patchOrganizer(sub, { isTalent }, put("talent", { sub, isTalent }));

  // Re-send an expired/lost invite (fresh temp password) to a pending organizer.
  const resend = async (sub: string, email: string) => {
    if (resends[sub]) return;
    setResends((r) => ({ ...r, [sub]: "sending" }));
    try {
      const res = await api("organizers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, resend: true }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Couldn't re-send the invite.");
      }
      setResends((r) => ({ ...r, [sub]: "sent" }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't re-send the invite.");
      setResends((r) => {
        const { [sub]: _, ...rest } = r;
        return rest;
      });
    }
  };

  // Unsearched = the 10 newest; searching filters everyone.
  const q = search.trim().toLowerCase();
  const visible = q
    ? organizers.filter(
        (o) =>
          (o.name || "").toLowerCase().includes(q) || o.email.toLowerCase().includes(q),
      )
    : organizers
        .slice()
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10);
  const listLabel = q
    ? `${visible.length} match${visible.length === 1 ? "" : "es"}`
    : organizers.length > visible.length
      ? `${visible.length} newest of ${organizers.length} — search for the rest`
      : `${organizers.length} organizer${organizers.length === 1 ? "" : "s"}`;

  return (
    <div style={{ maxWidth: 640 }}>
      <Link href="/dashboard/admin" style={{ color: "#0B8896", fontWeight: 600, fontSize: 14, textDecoration: "none" }}>
        ← Admin
      </Link>
      <h1 style={{ fontSize: 24, fontWeight: 800, margin: "12px 0 4px" }}>Organizers</h1>
      <p style={{ color: "#8A8A8A", fontSize: 14, margin: "0 0 18px" }}>
        Invite-only. We email a one-time password to set up the account.
      </p>

      {!loaded ? (
        <p style={{ color: "#8A8A8A" }}>Loading…</p>
      ) : (
        <>
          {error ? <p style={{ color: "#C0322B", fontSize: 14 }}>{error}</p> : null}

          {/* Tiers & caps — the ladder the per-organizer chips assign. */}
          <div style={card}>
            <div style={sectionLabel}>Tiers &amp; caps (guest passes per event)</div>
            {editTiers.map((t, i) => (
              <div key={t.level} style={tierRow}>
                <span style={levelBadge}>LVL {t.level}</span>
                <input
                  value={t.name}
                  onChange={(e) => updateTier(i, { name: e.target.value })}
                  placeholder={`Tier ${t.level}`}
                  style={{ ...inputStyle, flex: 2 }}
                />
                <input
                  value={t.guestCap}
                  onChange={(e) => updateTier(i, { guestCap: e.target.value })}
                  inputMode="numeric"
                  placeholder="16"
                  style={{ ...inputStyle, flex: 1 }}
                />
                <button onClick={() => removeTier(i)} title="Remove tier" style={removeBtn}>
                  ✕
                </button>
              </div>
            ))}
            <button onClick={addTier} style={addTierBtn}>
              + Add tier
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12 }}>
              <button onClick={saveTiers} disabled={savingTiers} style={btn}>
                {savingTiers ? "Saving…" : "Save tiers"}
              </button>
              {tiersMsg ? (
                <span style={{ color: tiersMsg.ok ? "#1B873F" : "#C0322B", fontSize: 13 }}>
                  {tiersMsg.text}
                </span>
              ) : null}
            </div>
          </div>

          {/* Invite */}
          <div style={card}>
            <div style={sectionLabel}>Add organizer</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                placeholder="Name"
                autoComplete="off"
                style={{ ...inputStyle, flex: 1 }}
              />
              <input
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="Email"
                type="email"
                autoComplete="off"
                style={{ ...inputStyle, flex: 1.4 }}
              />
              <button onClick={invite} disabled={inviting} style={btn}>
                {inviting ? "Sending…" : "Send invite"}
              </button>
            </div>
            {inviteMsg ? (
              <p style={{ color: inviteMsg.ok ? "#1B873F" : "#C0322B", fontSize: 13, marginTop: 8 }}>
                {inviteMsg.text}
              </p>
            ) : null}
          </div>

          {/* Organizer list — search the full set; unsearched shows the 10 newest. */}
          {organizers.length > 0 ? (
            <>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search organizers by name or email…"
                style={{ ...inputStyle, width: "100%", marginBottom: 12 }}
              />
              <div style={{ ...sectionLabel, marginTop: 4 }}>{listLabel}</div>
            </>
          ) : (
            <p style={{ color: "#8A8A8A", fontSize: 14 }}>No organizers yet.</p>
          )}
          {visible.length === 0 && organizers.length > 0 ? (
            <p style={{ color: "#8A8A8A", fontSize: 14 }}>No matches.</p>
          ) : null}
          {visible.map((o) => {
            const pending = o.status === "FORCE_CHANGE_PASSWORD";
            return (
              <div key={o.sub} style={card}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{o.name || o.email}</div>
                    <div style={{ color: "#8A8A8A", fontSize: 13 }}>{o.email}</div>
                  </div>
                  <span style={pending ? badgePending : badgeActive}>
                    {pending ? "Invited" : "Active"}
                  </span>
                </div>

                {pending ? (
                  <div style={chipRow}>
                    <span style={chipLabel}>Invite expired or lost?</span>
                    <button
                      onClick={() => resend(o.sub, o.email)}
                      disabled={resends[o.sub] === "sent"}
                      style={resends[o.sub] === "sent" ? chipActive : chip}
                    >
                      {resends[o.sub] === "sent"
                        ? "Invite re-sent ✓"
                        : resends[o.sub] === "sending"
                          ? "Sending…"
                          : "Resend invite"}
                    </button>
                  </div>
                ) : null}
                {tiers.length > 0 ? (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
                    {tiers.map((t) => {
                      const active = o.tier === t.level;
                      return (
                        <button
                          key={t.level}
                          onClick={() => changeTier(o.sub, t.level)}
                          style={active ? chipActive : chip}
                        >
                          {t.name}
                        </button>
                      );
                    })}
                  </div>
                ) : null}

                <div style={chipRow}>
                  <span style={chipLabel}>Platform fee</span>
                  <button
                    onClick={() => changeFee(o.sub, o.platformFeeRate === 0 ? null : 0)}
                    style={o.platformFeeRate === 0 ? chipActive : chip}
                  >
                    {o.platformFeeRate === 0 ? "0% — waived ✓" : "Waive (0%)"}
                  </button>
                </div>
                <div style={chipRow}>
                  <span style={chipLabel}>Pro (free/RSVP events)</span>
                  <button onClick={() => changePro(o.sub, !o.isPro)} style={o.isPro ? chipActive : chip}>
                    {o.isPro ? "Pro ✓" : "Make Pro"}
                  </button>
                </div>
                <div style={chipRow}>
                  <span style={chipLabel}>Talent (artist page + booking)</span>
                  <button
                    onClick={() => changeTalent(o.sub, !o.isTalent)}
                    style={o.isTalent ? chipTalent : chip}
                  >
                    {o.isTalent ? "Talent ✓" : "Make Talent"}
                  </button>
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

const card: React.CSSProperties = {
  background: "#FAFAFA",
  border: "none",
  borderRadius: 14,
  padding: 18,
  marginBottom: 16,
};
const sectionLabel: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: "#8A8A8A",
  textTransform: "uppercase",
  letterSpacing: 0.5,
  marginBottom: 8,
};
const inputStyle: React.CSSProperties = {
  boxSizing: "border-box",
  border: "none",
  borderRadius: 10,
  padding: "10px 12px",
  fontSize: 14,
  background: "#F4F3EF",
  color: "#22243A",
  minWidth: 0,
};
const btn: React.CSSProperties = {
  background: "#F5E642",
  color: "#191D33",
  border: "none",
  borderRadius: 10,
  padding: "10px 16px",
  fontWeight: 700,
  fontSize: 14,
  cursor: "pointer",
  whiteSpace: "nowrap",
};
const tierRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  marginBottom: 8,
};
const levelBadge: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: "#8A8A8A",
  letterSpacing: 0.5,
  width: 44,
  flexShrink: 0,
};
const removeBtn: React.CSSProperties = {
  background: "none",
  border: "none",
  color: "#C0322B",
  fontSize: 14,
  cursor: "pointer",
  padding: "6px 8px",
};
const addTierBtn: React.CSSProperties = {
  width: "100%",
  background: "none",
  border: "1.5px dashed #D9D9D9",
  borderRadius: 10,
  padding: "10px 0",
  fontWeight: 700,
  fontSize: 14,
  color: "#22243A",
  cursor: "pointer",
  marginTop: 4,
};
const badgeActive: React.CSSProperties = {
  background: "#F5E642",
  color: "#191D33",
  borderRadius: 20,
  padding: "4px 10px",
  fontSize: 12,
  fontWeight: 700,
  whiteSpace: "nowrap",
};
const badgePending: React.CSSProperties = {
  ...badgeActive,
  background: "#E8E8E8",
  color: "#666",
};
const chipRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginTop: 10,
};
const chipLabel: React.CSSProperties = { fontSize: 13, color: "#666" };
const chip: React.CSSProperties = {
  borderRadius: 16,
  border: "none",
  background: "#F4F3EF",
  color: "#666",
  padding: "6px 12px",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};
const chipActive: React.CSSProperties = {
  ...chip,
  background: "#0FA7B5",
  borderColor: "#0FA7B5",
  color: "#fff",
};
const chipTalent: React.CSSProperties = {
  ...chip,
  background: "#AF52DE",
  borderColor: "#AF52DE",
  color: "#fff",
};
