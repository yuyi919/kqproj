import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@refinedev/antd", "@stackframe/stack-shared"],
  output: "standalone",
  reactStrictMode: false,
  turbopack: {},
  // devIndicators: true,
  experimental: {
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

export default withNextIntl(nextConfig);
