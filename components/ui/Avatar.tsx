/* eslint-disable @next/next/no-img-element */
import { initials, avatarClasses } from "@/lib/initials";

/**
 * A student avatar: the uploaded profile photo when there is one, otherwise the
 * deterministic initials tile. Photos are stored on a separate domain (Vercel
 * Blob) and already re-encoded to a square, so a plain <img> is used (no
 * next/image remotePatterns needed).
 */
export function Avatar({
  name,
  photoUrl,
  size = 40,
  className = "",
}: {
  name: string;
  photoUrl?: string | null;
  size?: number;
  className?: string;
}) {
  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={name}
        width={size}
        height={size}
        style={{ width: size, height: size }}
        className={`flex-shrink-0 rounded-full object-cover ${className}`}
      />
    );
  }
  return (
    <span
      style={{
        width: size,
        height: size,
        fontSize: Math.max(10, Math.round(size * 0.38)),
      }}
      className={`flex flex-shrink-0 items-center justify-center rounded-full font-bold ${avatarClasses(
        name,
      )} ${className}`}
    >
      {initials(name)}
    </span>
  );
}
