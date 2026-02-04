/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@refinedev/antd"],
  output: "standalone",
  turbopack: {},
  // devIndicators: true,
  experimental:{
    // browserDebugInfoInTerminal: false
  },
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
  // experimental: {
  //   disableLogProxy: true,
  // },
};

export default nextConfig;
