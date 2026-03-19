/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['puppeteer-core', '@sparticuz/chromium'],
    outputFileTracingIncludes: {
      '/api/screenshot': ['./node_modules/@sparticuz/chromium/**'],
    },
  },
}
export default nextConfig
