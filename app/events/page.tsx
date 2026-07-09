import type { Metadata } from "next";

import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { browseEvents } from "@/lib/backend";

import { EventsBrowser } from "./EventsBrowser";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Find events — fansonly",
  description: "Underground shows, warehouse parties, and club nights near you.",
  openGraph: {
    title: "Find events — fansonly",
    description: "Underground shows, warehouse parties, and club nights near you.",
    type: "website",
  },
};

// Public event discovery — the web counterpart of the app's Find Events tab.
// Brand chrome stays dark; a club-crowd photo hero fades into the white body
// (flyer wall on paper), search floating over the seam.
export default async function EventsPage() {
  const initial = await browseEvents("");
  return (
    <>
      <SiteHeader signIn />
      <div className="find-page">
        <div className="find-photo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/find-hero.jpg" alt="" />
        </div>
        <div className="find-inner">
          <EventsBrowser initial={initial} />
        </div>
      </div>
      <SiteFooter />
    </>
  );
}
