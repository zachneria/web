"use client";

import { QRCodeSVG } from "qrcode.react";

export interface ViewTicket {
  id: string;
  qrToken: string;
  ownerName?: string;
  ticketTypeName?: string;
  status?: string;
}

export function TicketQRs({ tickets }: { tickets: ViewTicket[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {tickets.map((t, i) => {
        const used = t.status && t.status !== "active";
        return (
          <div
            key={t.id || i}
            style={{
              background: "#FAFAFA",
              borderRadius: 16,
              padding: 24,
              textAlign: "center",
              opacity: used ? 0.55 : 1,
            }}
          >
            <div style={{ fontSize: 11, letterSpacing: 1, color: "#999", fontWeight: 700 }}>
              TICKET {i + 1} OF {tickets.length}
            </div>
            {t.ticketTypeName ? (
              <div style={{ fontSize: 18, fontWeight: 800, color: "#191D33", margin: "4px 0 16px" }}>
                {t.ticketTypeName}
              </div>
            ) : null}
            <div style={{ display: "inline-block", border: "3px solid #0FA7B5", borderRadius: 12, padding: 10, background: "#fff" }}>
              <QRCodeSVG value={t.qrToken} size={200} />
            </div>
            {t.ownerName ? (
              <div style={{ fontSize: 14, color: "#666", marginTop: 12 }}>{t.ownerName}</div>
            ) : null}
            <div style={{ fontSize: 11, letterSpacing: 1, fontWeight: 700, color: used ? "#999" : "#191D33", marginTop: 8 }}>
              {used ? "CHECKED IN ✓" : "SHOW THIS AT THE DOOR"}
            </div>
          </div>
        );
      })}
    </div>
  );
}
