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
// Hero = DJ-deck photo in a rounded card (not full-bleed) with highlighter-
// block copy: solid yellow strips behind black type, staggered lines.
export default async function EventsPage() {
  const initial = await browseEvents("");
  return (
    <>
      <SiteHeader signIn />
      <div className="find-page">
        <div className="find-inner">
          <div className="find-photo">
            {/* Two frames on a very slow crossfade (pure CSS): DJ deck <-> laser crowd. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/find-hero.jpg" alt="" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/find-hero-2.jpg" alt="" className="find-photo-alt" />
            <div className="find-hero-copy">
              <span className="find-line">For the befores</span>
              <span className="find-line find-line-2">&amp; the afters</span>
            </div>
          </div>
          <EventsBrowser initial={initial} />
        </div>
      </div>
      <SiteFooter />
    </>
  );
}
