/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    dangerouslyAllowSVG: true,
    domains: ["i.ytimg.com", "i1.sndcdn.com", "i.vimeocdn.com", "embed-ssl.wistia.com", "static-cdn.jtvnw.net"],
  },
};

module.exports = nextConfig;
