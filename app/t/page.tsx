import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { TicketQRs, type ViewTicket } from "@/components/ticket-qrs";
import { getOrder } from "@/lib/backend";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your tickets — shabanga" };

// /t?token=<orderViewToken> — the SMS/email ticket link. Opens the shabanga app
// when installed (Universal Link); otherwise this web viewer renders the tickets
// (the token is the credential — same trust model as the email link).
export default async function TicketViewPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; c?: string }>;
}) {
  const { token, c } = await searchParams;

  let event: { name?: string; venueName?: string; eventDate?: string } | null = null;
  let tickets: ViewTicket[] = [];
  // "invalid" = the API answered 401/404 (bad/expired link). "transient" = no
  // usable answer (cold Lambda, timeout, 5xx) — the ticket is fine, so never
  // tell that buyer their link expired; tell them to retry instead.
  let error: "invalid" | "transient" | false = false;
  if (token || c) {
    try {
      const res = await getOrder(token, c);
      if (res.ok) {
        const data = await res.json();
        event = data.event ?? null;
        tickets = Array.isArray(data.tickets) ? data.tickets : [];
      } else {
        error = res.status === 401 || res.status === 404 ? "invalid" : "transient";
      }
    } catch {
      error = "transient";
    }
  }

  const fmt = (s?: string) =>
    s
      ? new Date(s).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })
      : "";

  return (
    <>
      <SiteHeader />
      <main style={{ maxWidth: 460, margin: "0 auto", padding: "24px 16px 64px" }}>
        {error === "transient" ? (
          <div style={{ textAlign: "center", padding: 32, color: "#777" }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#F2F2F2" }}>Couldn’t load your tickets</h1>
            <p style={{ marginTop: 8 }}>
              Your ticket is still good — this is just a connection hiccup on our end.
            </p>
            <a
              href={`/t?${c ? `c=${encodeURIComponent(c)}` : `token=${encodeURIComponent(token ?? "")}`}`}
              style={{
                display: "inline-block",
                marginTop: 16,
                background: "#0FA7B5",
                color: "#22243A",
                fontWeight: 700,
                borderRadius: 10,
                padding: "10px 22px",
                textDecoration: "none",
              }}
            >
              Try again
            </a>
          </div>
        ) : (!token && !c) || error ? (
          <div style={{ textAlign: "center", padding: 32, color: "#777" }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#F2F2F2" }}>Tickets not found</h1>
            <p style={{ marginTop: 8 }}>
              This link is invalid or expired. Try opening it again from your email or text.
            </p>
          </div>
        ) : (
          <>
            {event ? (
              <div style={{ marginBottom: 20, textAlign: "center" }}>
                <h1 style={{ fontSize: 24, fontWeight: 800, color: "#F2F2F2", margin: 0 }}>{event.name}</h1>
                <p style={{ color: "#777", fontSize: 14, marginTop: 4 }}>
                  {fmt(event.eventDate)}
                  {event.venueName ? ` · ${event.venueName}` : ""}
                </p>
              </div>
            ) : null}
            {tickets.length > 0 ? (
              <TicketQRs tickets={tickets} />
            ) : (
              <p style={{ textAlign: "center", color: "#777", padding: 24 }}>
                Your tickets are still being prepared — refresh in a moment.
              </p>
            )}
          </>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
