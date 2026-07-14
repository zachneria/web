# fo-web — shabanga.com website

Next.js (App Router) buyer site for shabanga. Server-rendered event pages with
real OG link previews + **admission-ticket** checkout via Stripe. It reads the
same `api.shabanga.com` APIs as the app — **no database of its own**.

## Routes

- `/` — homepage
- `/e/[id]` — event page + admission checkout (UUID id for now; pretty slugs later)
- `/api/events/[id]/intent`, `/api/order` — thin **server-side proxies** to the
  backend so the browser stays same-origin (no CORS to configure)

## Rules

- **ADMISSION ONLY.** Drinks / credits / merch are app-only — the site filters to
  `category === 'admission'` and never lists or sells the rest.
- **Payment flow:** PaymentIntent from `/tickets/events/:id/orders/intent` →
  Stripe **Payment Element** → the webhook issues tickets + emails → the success
  screen polls `/tickets/order` and shows the QR(s). Stripe gives Apple/Google
  Pay on web for free via the Payment Element.

## Env (both have safe defaults in code)

- `API_BASE_URL` (server) — default `https://api.shabanga.com`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (browser-safe) — defaults to the **test**
  key; set the **live** key in Vercel for production.

## Deploy (Vercel)

Connect the repo in Vercel (framework auto-detected as Next.js). Push to `main`
= production deploy; branches get preview URLs. Requires **Node ≥20** (Vercel
default; local dev needs `nvm use 20`). Custom domain: `shabanga.com`
(API stays on `api.shabanga.com`).
