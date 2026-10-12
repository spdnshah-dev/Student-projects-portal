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
};

export default nextConfig;
