// Avatar helpers: initials from a name, and a deterministic colour so the same
// person always gets the same tile (colours lifted from the design boards).

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const AVATARS = [
  "bg-[#FFE2CC] text-[#7A3410]",
  "bg-[#D7E6FF] text-[#123A7A]",
  "bg-[#DDF3E4] text-[#14532D]",
  "bg-[#EADDFB] text-[#4C1D95]",
  "bg-[#FDE2E4] text-[#7F1D2B]",
  "bg-[#FFF0C2] text-[#6B4A00]",
];

export function avatarClasses(seed: string): string {
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return AVATARS[h % AVATARS.length];
}
