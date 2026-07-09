import { redirect } from "next/navigation";

// The hub page is retired — the sidebar owns navigation now, so /dashboard
// lands straight on Events. (A stats Overview landing can live here later.)
export default function DashboardHub() {
  redirect("/dashboard/events");
}
