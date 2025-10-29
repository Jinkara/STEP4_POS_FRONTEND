require('dotenv').config();

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    // .env の API_ENDPOINT をビルド時に Next.js で使えるようにする
    API_ENDPOINT: process.env.API_ENDPOINT,
  },
  output: 'standalone', // Azure デプロイに必要
};

module.exports = nextConfig;
