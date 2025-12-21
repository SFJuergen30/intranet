/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@repo/shared"],
  images: {
    domains: ["res.cloudinary.com"],
  },
  async rewrites() {
    const backendUrl = process.env.BACKEND_INTERNAL_URL
      ? `http://${process.env.BACKEND_INTERNAL_URL}`
      : "http://localhost:3001";

    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/:path*`,
      },
    ];
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
