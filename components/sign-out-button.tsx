"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const signOut = async () => {
    setBusy(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.replace("/dashboard/login");
      router.refresh();
    }
  };
  return (
    <button
      onClick={signOut}
      disabled={busy}
      style={{
        background: "transparent",
        color: "#B7F34D",
        border: "1.5px solid #B7F34D",
        borderRadius: 8,
        padding: "6px 14px",
        fontWeight: 700,
        fontSize: 14,
        cursor: "pointer",
      }}
    >
      Sign out
    </button>
  );
}
