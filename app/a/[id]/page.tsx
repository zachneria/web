import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FaSpotify } from "react-icons/fa";
import {
  IoLogoFacebook,
  IoLogoInstagram,
  IoLogoTiktok,
  IoLogoYoutube,
} from "react-icons/io5";

import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { getArtist } from "@/lib/backend";
import { formatDate } from "@/lib/pricing";

import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const data = await getArtist(id);
  if (!data) return { title: "Artist — shabanga" };
  const { talent } = data;
  const desc =
    talent.bio || `Catch ${talent.name} at their next show — tickets on shabanga.`;
  const image = talent.photoUrl || "/logo.png";
  return {
    title: `${talent.name} — shabanga`,
    description: desc,
    openGraph: { title: talent.name, description: desc, images: [{ url: image }], type: "profile" },
    twitter: { card: "summary", title: talent.name, description: desc, images: [image] },
  };
}

// Featured-mix embed: SoundCloud/YouTube/Mixcloud render inline; anything else
// becomes a "Listen" link.
function MixEmbed({ url }: { url: string }) {
  if (/soundcloud\.com/.test(url)) {
    // SC MINI (20px) — Zach's pick 2026-07-15: the skinny strip, everywhere.
    const src = `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23af52de&auto_play=false&hide_related=true&show_comments=false&show_user=true&visual=true`;
    return <iframe className={styles.embed} height="300" src={src} allow="autoplay" title="Featured mix" />;
  }
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{6,})/);
  if (yt) {
    return (
      <iframe
        className={`${styles.embed} ${styles.embedVideo}`}
        src={`https://www.youtube.com/embed/${yt[1]}`}
        allow="encrypted-media; picture-in-picture"
        allowFullScreen
        title="Featured mix"
      />
    );
  }
  if (/mixcloud\.com/.test(url)) {
    const feed = new URL(url).pathname;
    return (
      <iframe
        className={styles.embed}
        height="120"
        src={`https://www.mixcloud.com/widget/iframe/?feed=${encodeURIComponent(feed)}&hide_cover=1&light=0`}
        title="Featured mix"
      />
    );
  }
  return (
    <a className={styles.listenLink} href={url} target="_blank" rel="noopener noreferrer">
      ▶ Listen to the featured mix
    </a>
  );
}

export default async function ArtistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getArtist(id);
  if (!data) notFound();

  const { talent, events, pastGigs, stats } = data;
  const initial = talent.name?.[0]?.toUpperCase() ?? "?";
  const genres = (talent.genres || "")
    .split(",")
    .map((g) => g.trim())
    .filter(Boolean);
  // Book goes straight to the artist's booking email when set (platform fallback).
  const bookHref = `mailto:${talent.bookingEmail || "hello@shabanga.com"}?subject=${encodeURIComponent(
    `Booking inquiry — ${talent.name} (via shabanga)`,
  )}`;

  return (
    <div className={styles.page}>
      <SiteHeader logo={false} wordmark={false} accent="#AF52DE" />

      {/* Hero */}
      <section className={styles.hero}>
        {talent.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={talent.photoUrl} alt={talent.name} className={styles.photo} />
        ) : (
          <div className={`${styles.photo} ${styles.photoFallback}`}>{initial}</div>
        )}
        <h1 className={styles.name}>{talent.name}</h1>
        <p className={styles.meta}>
          {[talent.handle ? `@${talent.handle}` : null, talent.city]
            .filter(Boolean)
            .join(" · ")}
        </p>
        {talent.links && Object.keys(talent.links).length > 0 && (
          <div className={styles.socials}>
            {talent.links.instagram && (
              <a className={styles.socialLink} href={talent.links.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <IoLogoInstagram size={22} />
              </a>
            )}
            {talent.links.tiktok && (
              <a className={styles.socialLink} href={talent.links.tiktok} target="_blank" rel="noopener noreferrer" aria-label="TikTok">
                <IoLogoTiktok size={22} />
              </a>
            )}
            {talent.links.spotify && (
              <a className={styles.socialLink} href={talent.links.spotify} target="_blank" rel="noopener noreferrer" aria-label="Spotify">
                <FaSpotify size={22} />
              </a>
            )}
            {talent.links.youtube && (
              <a className={styles.socialLink} href={talent.links.youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube">
                <IoLogoYoutube size={22} />
              </a>
            )}
            {talent.links.facebook && (
              <a className={styles.socialLink} href={talent.links.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <IoLogoFacebook size={22} />
              </a>
            )}
          </div>
        )}
        {genres.length > 0 && (
          <div className={styles.genres}>
            {genres.map((g) => (
              <span key={g} className={styles.genreChip}>
                {g}
              </span>
            ))}
          </div>
        )}
        {talent.bio && <p className={styles.bio}>{talent.bio}</p>}

        {(stats.shows > 0 || stats.promoters > 0) && (
          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.statNum}>{stats.shows}</span>
              <span className={styles.statLabel}>SHOWS</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statNum}>{stats.promoters}</span>
              <span className={styles.statLabel}>PROMOTERS</span>
            </div>
          </div>
        )}
      </section>

      <main className={styles.body}>
        {talent.mixUrl && (
          <section className={styles.section}>
            <h2 className={styles.sectionLabel}>FEATURED MIX</h2>
            <MixEmbed url={talent.mixUrl} />
          </section>
        )}

        {/* Rate + booking */}
        <section className={styles.section}>
          {talent.suggestedRate != null && (
            <div className={styles.rateStrip}>
              Suggested rate · <strong>from ${Math.round(talent.suggestedRate)}</strong>
              <span className={styles.rateNote}>set by artist</span>
            </div>
          )}
          <a className={styles.bookBtn} href={bookHref}>
            Book {talent.name}
          </a>
        </section>

        {/* Upcoming gigs */}
        {events.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionLabel}>CATCH THEM NEXT</h2>
            {events.map((e) => (
              <div key={e.id} className={styles.gigCard}>
                <div className={styles.gigDate}>
                  <span className={styles.gigMonth}>
                    {new Date(e.eventDate).toLocaleDateString("en-US", { month: "short" }).toUpperCase()}
                  </span>
                  <span className={styles.gigDay}>{new Date(e.eventDate).getDate()}</span>
                </div>
                <div className={styles.gigInfo}>
                  <div className={styles.gigName}>{e.name}</div>
                  <div className={styles.gigMeta}>
                    {e.venueName} ·{" "}
                    {e.organizerHandle ? (
                      <Link href={`/p/${e.organizerHandle}`} className={styles.gigPromoter}>
                        {e.organizerName}
                      </Link>
                    ) : (
                      e.organizerName
                    )}
                  </div>
                </div>
                <Link href={`/e/${e.slug || e.id}`} className={styles.ticketBtn}>
                  Get tickets
                </Link>
              </div>
            ))}
          </section>
        )}

        {/* Past gigs */}
        {pastGigs.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionLabel}>PAST GIGS</h2>
            <ul className={styles.pastList}>
              {pastGigs.map((e) => (
                <li key={e.id} className={styles.pastRow}>
                  <span className={styles.pastDot} />
                  <span className={styles.pastName}>{e.name}</span>
                  <span className={styles.pastDate}>{formatDate(e.eventDate)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {events.length === 0 && pastGigs.length === 0 && (
          <p className={styles.empty}>No gigs on the books yet — check back soon.</p>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
