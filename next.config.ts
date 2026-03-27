import type { NextConfig } from "next";
import path from "path";

const isProduction = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  output: "export",
  assetPrefix: isProduction ? "./" : undefined,
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
