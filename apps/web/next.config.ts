import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The structuring domain package ships TypeScript source directly (no
  // build step) so CI's typecheck/test stages never race a compile step;
  // Next must transpile it itself when bundling the production build.
  transpilePackages: ["@ideabin/ai-structuring"],
};

export default nextConfig;
