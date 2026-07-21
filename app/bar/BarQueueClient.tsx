"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

import styles from "./bar.module.css";

type ViewMode = "simple" | "board";
type BarStatus = "new" | "preparing" | "ready";

interface QueueItem {
  name: string;
  category: string;
  quantity: number;
}
interface QueueOrder {
  orderId: string;
  buyer: string;
  orderedAt: string;
  tip: number;
  barStatus?: BarStatus;
  readyAt?: string | null;
  items: QueueItem[];
}
interface QueueData {
  eventName: string;
  showTips: boolean;
  tipTotal: number;
  orders: QueueOrder[];
}

const CAT_EMOJI: Record<string, string> = { drink: "🍺", credits: "🪙", merch: "👕" };

// Board lanes in flow order. Ready's button is the redeem (complete); the others
// advance to the next lane.
const LANES: {
  key: BarStatus;
  label: string;
  dot: string;
  btn: string;
  bg: string;
  fg: string;
  next: BarStatus | "complete";
}[] = [
  { key: "new", label: "NEW", dot: "#F5A623", btn: "Start →", bg: "#F5A623", fg: "#3a2400", next: "preparing" },
  { key: "preparing", label: "PREPARING", dot: "#7C74FF", btn: "Mark ready", bg: "#7C74FF", fg: "#FFFFFF", next: "ready" },
  { key: "ready", label: "READY", dot: "#3ED66F", btn: "Complete ✓", bg: "#3ED66F", fg: "#0a2e14", next: "complete" },
];

function timeAgo(iso: string): string {
  const secs = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins} min ago`;
  return `${Math.floor(mins / 60)}h ago`;
}
// Compact age for the Ready timer ("ready 30s" / "ready 4m").
function since(iso: string): string {
  const secs = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h`;
}

export default function BarQueueClient() {
  const params = useSearchParams();
  const eventId = params.get("e") ?? "";

  const [viewMode, setViewMode] = useState<ViewMode>("simple");
  const [pin, setPin] = useState<string | null>(null);
  const [pinInput, setPinInput] = useState("");
  const [checking, setChecking] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [data, setData] = useState<QueueData | null>(null);
  const [completing, setCompleting] = useState<string | null>(null);
  const [, setTick] = useState(0); // 1s re-render so the ages stay live

  // Restore the view mode chosen on this device.
  useEffect(() => {
    const v = localStorage.getItem("barViewMode");
    if (v === "board" || v === "simple") setViewMode(v);
  }, []);
  const setMode = (m: ViewMode) => {
    setViewMode(m);
    localStorage.setItem("barViewMode", m);
  };

  // Restore a PIN saved on this device (a mounted iPad shouldn't re-prompt).
  useEffect(() => {
    if (!eventId) return;
    const saved = localStorage.getItem(`barPin:${eventId}`);
    if (saved) setPin(saved);
  }, [eventId]);

  const fetchQueue = useCallback(async () => {
    if (!eventId || !pin) return;
    try {
      const res = await fetch(`/api/bar-queue?e=${eventId}&pin=${encodeURIComponent(pin)}`, {
        cache: "no-store",
      });
      if (res.ok) setData(await res.json());
    } catch {
      /* transient — next poll recovers */
    }
  }, [eventId, pin]);

  // Poll every 5s while unlocked; tick every 1s for live ages.
  useEffect(() => {
    if (!pin) return;
    fetchQueue();
    const poll = setInterval(fetchQueue, 5000);
    const tick = setInterval(() => setTick((t) => t + 1), 1000);
    return () => {
      clearInterval(poll);
      clearInterval(tick);
    };
  }, [pin, fetchQueue]);

  // Keep a mounted display awake (best-effort — browsers gate this).
  const wakeRef = useRef<WakeLockSentinel | null>(null);
  useEffect(() => {
    if (!pin) return;
    const request = async () => {
      try {
        wakeRef.current = await navigator.wakeLock?.request("screen");
      } catch {
        /* not supported / denied — fine */
      }
    };
    request();
    const onVis = () => document.visibilityState === "visible" && request();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      wakeRef.current?.release().catch(() => {});
    };
  }, [pin]);

  const unlock = async () => {
    if (!/^\d{4,8}$/.test(pinInput) || !eventId) return;
    setChecking(true);
    setErr(null);
    try {
      const res = await fetch(`/api/bar-queue?e=${eventId}&pin=${encodeURIComponent(pinInput)}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        setErr("That PIN didn’t work. Check with the organizer.");
        return;
      }
      setData(await res.json());
      localStorage.setItem(`barPin:${eventId}`, pinInput);
      setPin(pinInput);
    } catch {
      setErr("Couldn’t reach the server — try again.");
    } finally {
      setChecking(false);
    }
  };

  // Board mode: advance an order to the next lane (optimistic, reconciled by poll).
  const advance = async (orderId: string, barStatus: BarStatus) => {
    if (!pin) return;
    setData((d) =>
      d
        ? {
            ...d,
            orders: d.orders.map((o) =>
              o.orderId === orderId
                ? { ...o, barStatus, readyAt: barStatus === "ready" ? new Date().toISOString() : o.readyAt }
                : o,
            ),
          }
        : d,
    );
    try {
      await fetch("/api/bar-queue/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, pin, orderId, barStatus }),
      });
    } catch {
      fetchQueue();
    }
  };

  const complete = async (orderId: string) => {
    if (!pin) return;
    setCompleting(orderId);
    setData((d) => (d ? { ...d, orders: d.orders.filter((o) => o.orderId !== orderId) } : d));
    try {
      await fetch("/api/bar-queue/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, pin, orderId }),
      });
    } catch {
      fetchQueue(); // restore true state on failure
    } finally {
      setCompleting(null);
    }
  };

  if (!eventId) {
    return (
      <div className={styles.gate}>
        <h1 className={styles.gateTitle}>No event</h1>
        <p className={styles.gateSub}>This link is missing its event. Ask the organizer to resend it.</p>
      </div>
    );
  }

  if (!pin) {
    return (
      <div className={styles.gate}>
        <div style={{ fontSize: 40 }}>🔒</div>
        <h1 className={styles.gateTitle}>Enter door PIN</h1>
        <p className={styles.gateSub}>Enter the PIN the organizer sent you to open the bar queue.</p>
        <input
          className={styles.pinInput}
          value={pinInput}
          onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ""))}
          onKeyDown={(e) => e.key === "Enter" && unlock()}
          inputMode="numeric"
          maxLength={8}
          type="password"
          placeholder="PIN"
          autoFocus
        />
        {err && <p className={styles.err}>{err}</p>}
        <button className={styles.gateBtn} disabled={checking} onClick={unlock}>
          {checking ? "…" : "Unlock"}
        </button>
      </div>
    );
  }

  const orders = data?.orders ?? [];

  // One order card. `lane` present → Board mode (per-lane button); else Simple.
  const card = (o: QueueOrder, lane?: (typeof LANES)[number]) => {
    const isReady = (o.barStatus ?? "new") === "ready";
    return (
      <div key={o.orderId} className={`${styles.card} ${lane && isReady ? styles.cardReady : ""}`}>
        <div className={styles.chd}>
          <span className={styles.who}>{o.buyer}</span>
          <span className={styles.chdRight}>
            {data?.showTips && o.tip > 0 && <span className={styles.tipchip}>💛 ${o.tip.toFixed(0)}</span>}
            <span className={styles.when}>
              {lane && isReady && o.readyAt ? `ready ${since(o.readyAt)}` : timeAgo(o.orderedAt)}
            </span>
          </span>
        </div>
        <div className={styles.items}>
          {o.items.map((it, i) => (
            <span key={i} className={styles.it}>
              <span className={styles.q}>{it.quantity}× </span>
              {CAT_EMOJI[it.category] ?? "•"} {it.name}
            </span>
          ))}
        </div>
        {lane && isReady && <div className={styles.ping}>🔔 Guest pinged — drinks ready</div>}
        {lane ? (
          <button
            className={styles.laneBtn}
            style={{ background: lane.bg, color: lane.fg }}
            disabled={completing === o.orderId}
            onClick={() =>
              lane.next === "complete" ? complete(o.orderId) : advance(o.orderId, lane.next as BarStatus)
            }
          >
            {lane.btn}
          </button>
        ) : (
          <button
            className={styles.doneBtn}
            disabled={completing === o.orderId}
            onClick={() => complete(o.orderId)}
          >
            Complete ✓
          </button>
        )}
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.top}>
        <span className={styles.brand}>The Bar</span>
        <div className={styles.evwrap}>
          <span className={styles.evname}>{data?.eventName ?? ""}</span>
        </div>

        <div className={styles.toggle}>
          {(["simple", "board"] as ViewMode[]).map((m) => (
            <button
              key={m}
              className={`${styles.seg} ${viewMode === m ? styles.segOn : ""}`}
              onClick={() => setMode(m)}
            >
              {m === "simple" ? "Simple" : "Full service"}
            </button>
          ))}
        </div>

        {data?.showTips && (
          <span className={styles.htips}>
            <span className={styles.htipsVal}>💛 ${data.tipTotal.toFixed(2)}</span>
            <span className={styles.htipsLbl}>tips</span>
          </span>
        )}
        <span className={styles.live}>● Live</span>
      </div>

      {viewMode === "board" ? (
        <div className={styles.board}>
          {LANES.map((lane) => {
            const laneOrders = orders.filter((o) => (o.barStatus ?? "new") === lane.key);
            return (
              <div key={lane.key} className={styles.lane}>
                <div className={styles.laneHead}>
                  <span className={styles.laneDot} style={{ background: lane.dot }} />
                  <span className={styles.laneLabel}>{lane.label}</span>
                  <span className={styles.count}>{laneOrders.length}</span>
                </div>
                <div className={styles.laneList}>
                  {laneOrders.map((o) => card(o, lane))}
                  {laneOrders.length === 0 && <div className={styles.laneEmpty}>—</div>}
                </div>
              </div>
            );
          })}
        </div>
      ) : orders.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyEmoji}>🍹</div>
          <div className={styles.emptyTitle}>No open orders</div>
          <div className={styles.emptySub}>New orders land here the moment a guest buys.</div>
        </div>
      ) : (
        <div className={styles.grid}>{orders.map((o) => card(o))}</div>
      )}
    </div>
  );
}
