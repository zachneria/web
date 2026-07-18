import type { MetadataRoute } from "next";

import { SITE_URL, SEO_LIVE } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  // Vercel preview/dev deployments must never be indexed.
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production") {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  // /t carries credential tokens in the URL; /dashboard + /api are private.
  const disallow = ["/dashboard", "/api", "/t"];
  // Pre-launch: keep event/promoter/artist pages out of the index entirely so
  // test events never surface. The marketing homepage still indexes.
  if (!SEO_LIVE) disallow.push("/e", "/p", "/a");
  return {
    rules: { userAgent: "*", allow: "/", disallow },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
