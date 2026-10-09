/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Certificate files are served from a separate storage domain (Vercel Blob in
  // test, S3 in production), never from the app's own origin. Remote patterns
  // are added per-environment via NEXT_PUBLIC_BLOB_HOST when storage is wired up.
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
