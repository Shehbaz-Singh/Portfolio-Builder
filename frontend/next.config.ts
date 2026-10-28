import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@parichay/shared'],
  // The resume PDF route reads its fonts from disk, so they must ship with the deployed function.
  outputFileTracingIncludes: { '/[username]/resume.pdf': ['./src/fonts/pdf/**'] },
};

export default nextConfig;
