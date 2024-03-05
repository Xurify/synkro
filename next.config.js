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
  async headers() {
    return [
      {
        source: "https://utfs.io/f/0c5f10fd-9e8b-401a-94bb-032d7820bda4-lbqvhy.mp3",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=2592000",
          },
        ],
      },
      {
        source: "https://utfs.io/f/bc2ccdfa-a4d0-4b79-9b98-f41034efa2ab-6tmzer.mp3",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=2592000",
          },
        ],
      },
      {
        source: "https://utfs.io/f/c77e24f4-9d3b-4a2d-98d9-6787d2280744-tmke27.mp3",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=2592000",
          },
        ],
      },
      {
        source: "https://utfs.io/f/b3b7e3cc-3abe-4e97-a813-028a9f20bae6-ml9rpw.mp",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=2592000",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;

// const withBundleAnalyzer = require("@next/bundle-analyzer")({
//   enabled: process.env.ANALYZE === "true",
// });
// module.exports = withBundleAnalyzer({});
