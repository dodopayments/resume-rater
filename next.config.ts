import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Ensure these native/SDK packages are not bundled into the standalone server build
  serverExternalPackages: ["pdf-parse", "mammoth", "dodopayments"],
};

export default nextConfig;
