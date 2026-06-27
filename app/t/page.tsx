import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { TicketQRs, type ViewTicket } from "@/components/ticket-qrs";
import { getOrder } from "@/lib/backend";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your tickets — fansonly" };

// /t?token=<orderViewToken> — the SMS/email ticket link. Opens the fansonly app
// when installed (Universal Link); otherwise this web viewer renders the tickets
// (the token is the credential — same trust model as the email link).
export default async function TicketViewPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  let event: { name?: string; venueName?: string; eventDate?: string } | null = null;
  let tickets: ViewTicket[] = [];
  let error = false;
  if (token) {
    try {
      const res = await getOrder(token);
      if (res.ok) {
        const data = await res.json();
        event = data.event ?? null;
        tickets = Array.isArray(data.tickets) ? data.tickets : [];
      } else {
        error = true;
      }
    } catch {
      error = true;
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
        {!token || error ? (
          <div style={{ textAlign: "center", padding: 32, color: "#777" }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#111" }}>Tickets not found</h1>
            <p style={{ marginTop: 8 }}>
              This link is invalid or expired. Try opening it again from your email or text.
            </p>
          </div>
        ) : (
          <>
            {event ? (
              <div style={{ marginBottom: 20, textAlign: "center" }}>
                <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111", margin: 0 }}>{event.name}</h1>
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
