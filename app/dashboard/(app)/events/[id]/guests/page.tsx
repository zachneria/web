import Link from "next/link";

import { TipsRail, type Tip } from "../../../TipsRail";
import { EventDetail, Guest, card, getJSON, row } from "../_shared";
import { GuestAddForm } from "./GuestAddForm";

const GUEST_TIPS: Tip[] = [
  {
    key: "publish-gate",
    title: "Passes need a published event",
    body: "You can build the guest list on a draft, but passes can't be generated or sent until the event is published — the QR is the credential for Wallet, email, and share alike.",
  },
  {
    key: "plus-ones",
    title: "Plus-ones ride the same pass",
    body: "A guest's +N comes in on their one QR — the door scanner shows the plus-one count, so the whole group enters on a single scan.",
  },
  {
    key: "drink-credits",
    title: "Drink credits are per guest",
    body: "Set a number or Unlimited when you add the guest; the bar scanner tracks it against their pass.",
  },
  {
    key: "tier-colors",
    title: "Tier colors carry through",
    body: "General, Comp, VIP, and Talent passes are color-coded on the pass and email (VIP gold, Talent purple), so door and bar staff can spot them at a glance.",
  },
];

export const dynamic = "force-dynamic";

export default async function GuestsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [event, guests] = await Promise.all([
    getJSON<EventDetail>(`/events/${id}`),
    getJSON<Guest[]>(`/guests/events/${id}/guests`),
  ]);

  return (
    <div className="dsh-content-row">
      <div className="dsh-content-main" style={{ maxWidth: 640 }}>
      <Link href={`/dashboard/events/${id}`} style={{ color: "#0B8896", fontWeight: 700, fontSize: 14 }}>
        {event?.name ?? "Event"}
      </Link>
      <h1 style={{ fontSize: 24, fontWeight: 800, margin: "12px 0 18px", color: "#161616" }}>
        Guests {guests && guests.length > 0 ? `(${guests.length})` : ""}
      </h1>

      <GuestAddForm eventId={id} />

      <div style={card}>
        {!guests || guests.length === 0 ? (
          <div style={{ color: "#8A8A8A" }}>No guest passes yet — add one above.</div>
        ) : (
          guests.map((g) => (
            <div key={g.id} style={row}>
              <span style={{ color: "#333333" }}>{g.name}</span>
              {g.email ? <span style={{ color: "#8A8A8A", fontSize: 13 }}>{g.email}</span> : null}
            </div>
          ))
        )}
      </div>
      </div>
      <TipsRail tips={GUEST_TIPS} title="Good to know" />
    </div>
  );
}
