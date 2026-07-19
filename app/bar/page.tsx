import { Suspense } from "react";

import BarQueueClient from "./BarQueueClient";

export const metadata = {
  title: "Bar queue — shabanga",
  // Staff tool, PIN-gated — keep it out of search.
  robots: { index: false, follow: false },
};

// shabanga.com/bar?e=<eventId> — the PIN-gated bar order display for a mounted
// iPad. No app, no login: open the link, enter the door PIN, work the queue.
export default function BarQueuePage() {
  return (
    <Suspense fallback={null}>
      <BarQueueClient />
    </Suspense>
  );
}
