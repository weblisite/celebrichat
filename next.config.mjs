/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true
  },
  typescript: {
    // During CI, set to true to fail builds on type errors. Left as default locally.
  },
  eslint: {
    // During CI, set to true to fail builds on lint errors. Left as default locally.
  }
};

export default config;
