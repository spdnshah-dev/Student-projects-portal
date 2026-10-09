/** Short "time ago" label, e.g. "3 days", "5 hours", "just now". */
export function timeAgo(date: Date): string {
  const secs = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  const mins = Math.floor(secs / 60);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days} day${days === 1 ? "" : "s"}`;
  if (hours > 0) return `${hours} hour${hours === 1 ? "" : "s"}`;
  if (mins > 0) return `${mins} min${mins === 1 ? "" : "s"}`;
  return "just now";
}
