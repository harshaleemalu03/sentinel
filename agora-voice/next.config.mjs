import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',

  // Agora is exposed through the shared Sentinel domain at /voice.
  basePath: '/voice',

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
