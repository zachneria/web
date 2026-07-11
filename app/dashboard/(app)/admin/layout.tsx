import { redirect } from "next/navigation";

import { getOrgClaims } from "@/lib/org-api";

// Admin-only section. This redirect is UX — the real gate is fo-users
// (requireAdmin 403s any non-admin token on every /users/admin route).
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAdmin } = await getOrgClaims();
  if (!isAdmin) redirect("/dashboard/events");
  return <>{children}</>;
}
