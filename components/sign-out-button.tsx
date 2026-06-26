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
        color: "#F5E642",
        border: "1.5px solid #F5E642",
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
