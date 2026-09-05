import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'standalone',

  // Standalone output for clean cloud and serverless deployment
  images: {
    unoptimized: true,
  },


  turbopack: {
    root: rootDir,
  },

  experimental: {
    webpackBuildWorker: true,
    parallelServerBuildTraces: true,
    parallelServerCompiles: true,
  },
};

export default nextConfig;
