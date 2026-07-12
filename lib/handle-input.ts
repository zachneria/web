// Live input filter for handle fields (fansonly.live/p/… and /a/…).
// Handles allow only lowercase letters, numbers, and hyphens (see fo-users
// lib/handles.js). Instead of silently swallowing a typed "." (or erroring at
// save), strip it AND say why — people naturally type periods ("crew.live").
export function cleanHandleInput(raw: string): {
  value: string;
  warning: string | null;
} {
  const lower = raw.toLowerCase();
  const value = lower.replace(/[^a-z0-9-]/g, "");
  if (value === lower) return { value, warning: null };
  const stripped = lower.replace(/[a-z0-9-]/g, "");
  const warning = stripped.includes(".")
    ? "Periods aren't allowed in your link — use letters, numbers, or hyphens."
    : /^\s+$/.test(stripped)
      ? "Spaces aren't allowed in your link — use hyphens instead."
      : "Only lowercase letters, numbers, and hyphens are allowed.";
  return { value, warning };
}
