"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

import styles from "./bar.module.css";

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
  items: QueueItem[];
}
interface QueueData {
  eventName: string;
  showTips: boolean;
  tipTotal: number;
  orders: QueueOrder[];
}

const CAT_EMOJI: Record<string, string> = { drink: "🍺", credits: "🪙", merch: "👕" };

function timeAgo(iso: string): string {
  const secs = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins} min ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

export default function BarQueueClient() {
  const params = useSearchParams();
  const eventId = params.get("e") ?? "";

  const [pin, setPin] = useState<string | null>(null);
  const [pinInput, setPinInput] = useState("");
  const [checking, setChecking] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [data, setData] = useState<QueueData | null>(null);
  const [completing, setCompleting] = useState<string | null>(null);

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

  // Poll every 5s while unlocked.
  useEffect(() => {
    if (!pin) return;
    fetchQueue();
    const t = setInterval(fetchQueue, 5000);
    return () => clearInterval(t);
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

  return (
    <div className={styles.container}>
      <div className={styles.top}>
        <span className={styles.brand}>The Bar</span>
        <div className={styles.evwrap}>
          <span className={styles.evname}>{data?.eventName ?? ""}</span>
        </div>
        {data?.showTips && (
          <span className={styles.htips}>
            <span className={styles.htipsVal}>💛 ${data.tipTotal.toFixed(2)}</span>
            <span className={styles.htipsLbl}>tips</span>
          </span>
        )}
      </div>

      {orders.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyEmoji}>🍹</div>
          <div className={styles.emptyTitle}>No open orders</div>
          <div className={styles.emptySub}>New orders land here the moment a guest buys.</div>
        </div>
      ) : (
        <div className={styles.grid}>
          {orders.map((o) => (
            <div key={o.orderId} className={styles.card}>
              <div className={styles.chd}>
                <span className={styles.who}>{o.buyer}</span>
                <span className={styles.chdRight}>
                  {data?.showTips && o.tip > 0 && (
                    <span className={styles.tipchip}>💛 ${o.tip.toFixed(0)}</span>
                  )}
                  <span className={styles.when}>{timeAgo(o.orderedAt)}</span>
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
              <button
                className={styles.doneBtn}
                disabled={completing === o.orderId}
                onClick={() => complete(o.orderId)}
              >
                Complete ✓
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
