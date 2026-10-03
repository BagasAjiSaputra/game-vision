import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  experimental: {
    serverActions: {
      // Screenshot game dikirim sebagai base64 lewat Server Action (default limit 1 MB)
      bodySizeLimit: "5mb",
    },
  },
};

export default nextConfig;
