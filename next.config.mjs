/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@refinedev/antd"],
  output: "standalone",
  turbopack: {}
};

export default nextConfig;
