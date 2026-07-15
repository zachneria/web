"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { IconType } from "react-icons";
import {
  IoCalendarOutline,
  IoCashOutline,
  IoConstructOutline,
  IoGlobeOutline,
  IoMegaphoneOutline,
  IoMusicalNotesOutline,
  IoSearchOutline,
  IoSettingsOutline,
} from "react-icons/io5";

// Icon-only sidebar nav — the same outline Ionicons the app uses. Labels live
// in tooltips (title). Teal = the active/selected language; Artist keeps the
// purple talent accent.
const ITEMS: {
  href: string;
  Icon: IconType;
  label: string;
  accent?: string;
  talentOnly?: boolean;
  adminOnly?: boolean;
}[] = [
  { href: "/dashboard/events", Icon: IoCalendarOutline, label: "Your Events" },
  { href: "/dashboard/find", Icon: IoSearchOutline, label: "Find Events" },
  { href: "/dashboard/marketing", Icon: IoMegaphoneOutline, label: "Marketing" },
  { href: "/dashboard/promoter-settings", Icon: IoGlobeOutline, label: "Promoter Profile" },
  { href: "/dashboard/artist-settings", Icon: IoMusicalNotesOutline, label: "Artist Settings", accent: "#AF52DE", talentOnly: true },
  { href: "/dashboard/payouts", Icon: IoCashOutline, label: "Payouts" },
  { href: "/dashboard/account-settings", Icon: IoSettingsOutline, label: "Account Settings" },
  { href: "/dashboard/admin", Icon: IoConstructOutline, label: "Admin Settings", adminOnly: true },
];

export function DashNav({ isTalent, isAdmin }: { isTalent: boolean; isAdmin: boolean }) {
  const pathname = usePathname();
  return (
    <nav className="dsh-nav" aria-label="Dashboard">
      {ITEMS.filter((i) => (!i.talentOnly || isTalent) && (!i.adminOnly || isAdmin)).map((i) => {
        const active = pathname === i.href || pathname.startsWith(i.href + "/");
        return (
          <Link
            key={i.href}
            href={i.href}
            title={i.label}
            aria-label={i.label}
            className={`dsh-nav-item${active ? " dsh-nav-active" : ""}`}
          >
            <i.Icon size={24} color={active ? "#0B8896" : (i.accent ?? "#555")} />
          </Link>
        );
      })}
    </nav>
  );
}
