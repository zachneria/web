"use client";

import { useEffect, useState } from "react";

// Mobile-only choice: open the event in the native app (richer — at-venue
// drinks/credits live there) or continue in the browser. Desktop never sees it.
// "Open in app" uses the foapp:// scheme, so it works for anyone who already
// has the app installed. (No App Store fallback yet — pre-launch.)
export default function AppBanner({ eventId }: { eventId: string }) {
  const [mobile, setMobile] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent || "";
    setMobile(/iphone|ipad|ipod|android/i.test(ua));
  }, []);

  if (!mobile || dismissed) return null;

  return (
    <div className="appbanner">
      <div className="appbanner-copy">
        <strong>Get the full experience</strong>
        <span>Order drinks &amp; more at the venue — open this event in the app.</span>
      </div>
      <div className="appbanner-actions">
        <a className="appbanner-open" href={`foapp://buy/${eventId}`}>
          Open in app
        </a>
        <button className="appbanner-web" onClick={() => setDismissed(true)}>
          Continue on web
        </button>
      </div>
    </div>
  );
}
