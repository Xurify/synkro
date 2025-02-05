import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source:
          "/ingest/static/(web-vitals.js|dead-clicks-autocapture.js|recorder.js)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
    ];
  },
  images: {
    dangerouslyAllowSVG: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.synkro.live",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "i.ytimg.com",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "i1.sndcdn.com",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "i.vimeocdn.com",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "embed-ssl.wistia.com",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "static-cdn.jtvnw.net",
        pathname: "**",
      },
    ],
  },
};

export default nextConfig;
