/** Compact relative time — "now", "3h", "2d", "5w", then a date. */
export function timeAgo(iso: string, now: Date = new Date()): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const s = Math.max(0, (now.getTime() - then) / 1000);
  if (s < 60) return 'now';
  const m = s / 60;
  if (m < 60) return `${Math.floor(m)}m`;
  const h = m / 60;
  if (h < 24) return `${Math.floor(h)}h`;
  const d = h / 24;
  if (d < 7) return `${Math.floor(d)}d`;
  const w = d / 7;
  if (w < 5) return `${Math.floor(w)}w`;
  return new Date(iso).toLocaleDateString();
}
