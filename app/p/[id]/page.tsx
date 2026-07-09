import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { IoLogoFacebook, IoLogoInstagram, IoLogoTiktok } from "react-icons/io5";

import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { getPromoter } from "@/lib/backend";
import { formatDate, formatTime } from "@/lib/pricing";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const data = await getPromoter(id);
  if (!data) return { title: "Promoter — fansonly" };
  const { organizer } = data;
  const desc = `Upcoming events from ${organizer.name}`;
  const image = organizer.logoUrl || "/logo.png";
  return {
    title: `${organizer.name} — fansonly`,
    description: desc,
    openGraph: { title: organizer.name, description: desc, images: [{ url: image }], type: "website" },
    twitter: { card: "summary", title: organizer.name, description: desc, images: [image] },
  };
}

export default async function PromoterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getPromoter(id);
  if (!data) notFound();

  const { organizer, events } = data;
  const initial = organizer.name?.[0]?.toUpperCase() ?? "?";

  return (
    <>
      <SiteHeader />
      <main className="promoter">
        <div className="promoter-hero">
          {organizer.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={organizer.logoUrl} alt={organizer.name} className="promoter-logo" />
          ) : (
            <div className="promoter-logo promoter-logo-fallback">{initial}</div>
          )}
          <h1 className="promoter-name">{organizer.name}</h1>
          <p className="promoter-sub">
            {events.length > 0
              ? `${events.length} upcoming event${events.length === 1 ? "" : "s"}`
              : "No upcoming events right now"}
          </p>
          {organizer.bio ? <p className="promoter-bio">{organizer.bio}</p> : null}
          {organizer.links?.instagram || organizer.links?.facebook || organizer.links?.tiktok ? (
            <div className="promoter-socials">
              {organizer.links?.instagram ? (
                <a href={organizer.links.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                  <IoLogoInstagram size={22} />
                </a>
              ) : null}
              {organizer.links?.tiktok ? (
                <a href={organizer.links.tiktok} target="_blank" rel="noopener noreferrer" aria-label="TikTok">
                  <IoLogoTiktok size={22} />
                </a>
              ) : null}
              {organizer.links?.facebook ? (
                <a href={organizer.links.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                  <IoLogoFacebook size={22} />
                </a>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="event-list">
          {events.map((ev) => (
            <Link key={ev.id} href={`/e/${ev.id}`} className="event-card">
              {/* Uniform date block (matches the /a gig cards) — flyer thumbs
                  made the list a patchwork of mismatched crops. */}
              <div className="event-card-date">
                <span className="event-card-month">
                  {new Date(ev.eventDate)
                    .toLocaleDateString("en-US", { month: "short" })
                    .toUpperCase()}
                </span>
                <span className="event-card-day">{new Date(ev.eventDate).getDate()}</span>
              </div>
              <div className="event-card-body">
                <span className="event-card-name">{ev.name}</span>
                <span className="event-card-meta">
                  {formatDate(ev.eventDate)} · {formatTime(ev.eventDate)}
                </span>
                <span className="event-card-venue">{ev.venueName}</span>
              </div>
              {ev.soldOut ? (
                <span className="pill pill-soldout">Sold out</span>
              ) : ev.currentTier ? (
                <span className="pill">{ev.currentTier}</span>
              ) : null}
            </Link>
          ))}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
