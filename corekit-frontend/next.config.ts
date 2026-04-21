import type { NextConfig } from "next";
import path from "path";

const backendOrigin =
  process.env.NEXT_PUBLIC_BACKEND_ORIGIN ||
  (process.env.NODE_ENV === "development" ? "http://localhost:6767" : "");

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  async rewrites() {
    if (!backendOrigin) return [];
    const origin = backendOrigin.replace(/\/$/, "");
    return [
      {
        source: "/api/:path*",
        destination: `${origin}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
