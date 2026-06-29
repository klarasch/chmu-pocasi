import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  async rewrites() {
    return [
      {
        source: "/radar",
        destination: "/",
      },
    ];
  },
};

export default nextConfig;
