import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  ...(process.env.BUILD_TARGET === "export" ? { output: "export" } : {}),
};

export default nextConfig;
