import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  async redirects() {
    return [
      { source: "/x", destination: "/howxworks", permanent: true },
      { source: "/x-algorithm", destination: "/howxworks", permanent: true },
      // Bare folder path would otherwise 404 (public files match exact paths).
      // /yc-fintech-wave-map/index.html itself must keep serving content —
      // never bounce it back to /yc-fintech-map: the short URL briefly shipped
      // as a 308 to it, and a cached 308 plus a reverse redirect would loop.
      {
        source: "/yc-fintech-wave-map",
        destination: "/yc-fintech-map",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      // Canonical short URL for the static YC fintech wave map; the page's
      // asset references are absolute, so it renders from any mount point.
      {
        source: "/yc-fintech-map",
        destination: "/yc-fintech-wave-map/index.html",
      },
    ];
  },
};

export default nextConfig;
