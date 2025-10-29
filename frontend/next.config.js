// next.config.js
require('dotenv').config();

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    API_ENDPOINT: process.env.API_ENDPOINT,
  },
  output: 'standalone',
  outputFileTracingRoot: __dirname, // ← これが警告対策！
};

module.exports = nextConfig;
