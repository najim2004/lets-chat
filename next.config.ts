/** @type {import('next').NextConfig} */
const config: import("next").NextConfig = {
  // Enable React's Strict Mode for development
  reactStrictMode: true,

  // Use SWC for minification (faster than Terser)
  swcMinify: true,

  // Configure image domains for next/image
  images: {
    domains: [],
    // You can add trusted image domains here
    // Example: domains: ['example.com', 'images.example.com']
  },

  // Add other configurations as needed
  // experimental: {},
  // webpack: (config, { isServer }) => { return config },
  // headers: async () => [],
  // redirects: async () => [],
};

export default config;
