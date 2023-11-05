/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  optimizeFonts: false,
  images: {
    dangerouslyAllowSVG: true,
    domains: ["synkro.vercel.app", "i.ytimg.com", "i1.sndcdn.com", "i.vimeocdn.com", "embed-ssl.wistia.com", "static-cdn.jtvnw.net"],
  },
};

module.exports = nextConfig;
