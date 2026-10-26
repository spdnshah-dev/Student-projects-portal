/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Certificate files are served from a separate storage domain (Vercel Blob in
  // test, S3 in production), never from the app's own origin. Remote patterns
  // are added per-environment via NEXT_PUBLIC_BLOB_HOST when storage is wired up.
  images: {
    remotePatterns: [],
  },
  // Photo and certificate uploads go through Server Actions, whose request body
  // defaults to a 1 MB cap. Raise it to comfortably fit the 10 MB file limit
  // the upload UI promises (plus multipart overhead) so large files reach our
  // own size check instead of being rejected by the framework.
  experimental: {
    serverActions: {
      bodySizeLimit: "12mb",
    },
  },
  // Security headers. Fonts are self-hosted via next/font, so no external
  // origins are needed except the public Blob host for photos/certificates
  // (images and the PDF viewer frame). 'unsafe-inline' for scripts/styles is
  // required by Next.js hydration and Tailwind without a nonce setup; external
  // script origins are still blocked.
  async headers() {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://*.public.blob.vercel-storage.com",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-src https://*.public.blob.vercel-storage.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
    ].join("; ");
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
