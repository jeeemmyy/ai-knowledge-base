/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Transpile workspace packages so their TS source is compiled by Next.
  transpilePackages: ['@repo/shared', '@repo/utils'],
};

export default nextConfig;
