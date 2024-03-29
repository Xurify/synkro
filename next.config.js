/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  optimizeFonts: false,
  images: {
    dangerouslyAllowSVG: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "synkro.vercel.app",
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

module.exports = nextConfig;

// const withBundleAnalyzer = require("@next/bundle-analyzer")({
//   enabled: process.env.ANALYZE === "true",
// });
// module.exports = withBundleAnalyzer({});
