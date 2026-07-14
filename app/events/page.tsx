import { redirect } from "next/navigation";

// MOTHBALLED FOR LAUNCH (2026-07-14): a browse page with a handful of events
// broadcasts emptiness — cold-start rule: no discovery surface until there's
// density. The real page lives in page.tsx.mothballed (+ EventsBrowser.tsx,
// untouched); to relaunch, swap the files back and restore the two entry
// links (homepage ctaRow + site-chrome topbar-find).
export default function EventsMothballed() {
  redirect("/");
}
