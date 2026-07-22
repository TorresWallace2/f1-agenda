/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["192.168.1.20", "192.168.1.20:3000"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com"
      },
      {
        protocol: "https",
        hostname: "media.formula1.com"
      },
      {
        protocol: "https",
        hostname: "www.fiaformula2.com"
      }
    ]
  }
};

export default nextConfig;
