import { NextRequest } from "next/server";

import { getOrgClaims, orgFetch } from "@/lib/org-api";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

// POST /api/dashboard/logo — raw image bytes (Content-Type = image/png|jpeg|webp).
// Server-side flow (avoids browser→S3 CORS): presigned URL → PUT to S3 →
// save logoUrl on the User row. Returns { logoUrl }.
export async function POST(req: NextRequest) {
  const { sub } = await getOrgClaims();
  if (!sub) return json({ error: "Not signed in" }, 401);

  const contentType = req.headers.get("content-type") || "image/png";
  if (!/^image\/(png|jpeg|webp)$/.test(contentType)) {
    return json({ error: "Use a PNG, JPEG, or WebP image." }, 400);
  }
  const bytes = await req.arrayBuffer();
  if (bytes.byteLength === 0) return json({ error: "Empty file." }, 400);
  if (bytes.byteLength > 5 * 1024 * 1024) return json({ error: "Image too large (max 5MB)." }, 400);

  // 1) presigned PUT url
  const uRes = await orgFetch("/events/upload-url", {
    method: "POST",
    body: JSON.stringify({ contentType, kind: "logo" }),
  });
  if (!uRes.ok) return json({ error: "Couldn't start the upload." }, 502);
  const { uploadUrl, publicUrl } = await uRes.json();

  // 2) upload bytes straight to S3
  const put = await fetch(uploadUrl, {
    method: "PUT",
    body: bytes,
    headers: { "Content-Type": contentType },
  });
  if (!put.ok) return json({ error: "Upload failed." }, 502);

  // 3) save the public URL on the profile
  const sRes = await orgFetch(`/users/${sub}`, {
    method: "PUT",
    body: JSON.stringify({ logoUrl: publicUrl }),
  });
  if (!sRes.ok) return json({ error: "Saved the image but couldn't update your profile." }, 502);

  return json({ logoUrl: publicUrl });
}
