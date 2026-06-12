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
      // Short, typeable alias for the static YC fintech wave map
      {
        source: "/yc-fintech-map",
        destination: "/yc-fintech-wave-map/index.html",
        permanent: true,
      },
      // Bare folder path would otherwise 404 (public files match exact paths)
      {
        source: "/yc-fintech-wave-map",
        destination: "/yc-fintech-wave-map/index.html",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
