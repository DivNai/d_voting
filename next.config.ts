import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // This allows Next.js to ignore certain node modules 
  // that sometimes cause issues with Web3 libraries during server-side rendering
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },

  // This is helpful if you are deploying to a platform like Vercel
  // It ensures your contract files are included in the build
  images: {
    unoptimized: true, // Useful if you're hosting images locally in /public
  },
};

export default nextConfig;