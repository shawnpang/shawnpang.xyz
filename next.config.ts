import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  async redirects() {
    return [
      {
        source: "/howxworks",
        destination: "/x-algorithm",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
