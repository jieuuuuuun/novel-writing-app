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
    ];
  },
};

export default nextConfig;
