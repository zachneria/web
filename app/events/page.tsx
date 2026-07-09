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
// Brand chrome stays dark; the body is white for readability (flyer wall on
// paper), with the homepage's yellow glow bleeding behind the hero.
export default async function EventsPage() {
  const initial = await browseEvents("");
  return (
    <>
      <SiteHeader signIn />
      <div className="find-page">
        <div className="find-hero">
          <h1 className="find-title">Find your next show</h1>
          <p className="find-sub">Underground shows, listed by the people throwing them.</p>
        </div>
        <EventsBrowser initial={initial} />
      </div>
      <SiteFooter />
    </>
  );
}
