/** @type {import('next').NextConfig} */
const nextConfig = {
  // No need for experimental.appDir in Next.js 15+
  reactStrictMode: false, // Disable strict mode to prevent Leaflet map initialization issues
}

module.exports = nextConfig 