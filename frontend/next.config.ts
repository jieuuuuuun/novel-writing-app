import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const backendUrl = (process.env.BACKEND_URL ?? "http://localhost:3001").replace(
      /\/$/,
      "",
    );

    return [
      {
        source: "/api/work",
        destination: `${backendUrl}/work`,
      },
      {
        source: "/api/work/:path*",
        destination: `${backendUrl}/work/:path*`,
      },
      {
        source: "/api/episode",
        destination: `${backendUrl}/episode`,
      },
    ];
  },
};

export default nextConfig;
