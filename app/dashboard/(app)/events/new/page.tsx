import { CreateFlow } from "./CreateFlow";

export const dynamic = "force-dynamic";

// /dashboard/events/new?m=describe|link|scratch — the three live create
// methods from the events page tiles (screenshot import is app "coming soon").
export default async function NewEventPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>;
}) {
  const { m } = await searchParams;
  const method = m === "describe" || m === "link" ? m : "scratch";
  return <CreateFlow method={method} />;
}
