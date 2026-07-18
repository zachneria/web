import type { MetadataRoute } from "next";

import { browseEvents } from "@/lib/backend";
import { SITE_URL, SEO_LIVE } from "@/lib/seo";

// Rebuilt hourly. Events come from /events/search (published + discoverable,
// upcoming/in-progress) — non-discoverable events are link-only by intent and
// stay OUT of the sitemap. Discovery leans on this since the public /events
// browse index is mothballed for launch.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const home = { url: SITE_URL, changeFrequency: "daily" as const, priority: 1 };
  // Pre-launch: homepage only — no test events in the sitemap.
  if (!SEO_LIVE) return [home];

  const events = await browseEvents();

  const eventUrls: MetadataRoute.Sitemap = events.map((e) => ({
    url: `${SITE_URL}/e/${e.slug || e.id}`,
    lastModified: e.updatedAt ? new Date(e.updatedAt) : undefined,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  // One entry per distinct promoter surfaced by the current events.
  const promoterKeys = new Set<string>();
  for (const e of events) {
    const key = e.organizerHandle || e.organizerId;
    if (key) promoterKeys.add(key);
  }
  const promoterUrls: MetadataRoute.Sitemap = [...promoterKeys].map((k) => ({
    url: `${SITE_URL}/p/${k}`,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [home, ...eventUrls, ...promoterUrls];
}
