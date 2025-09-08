/** @type {import('next').NextConfig} */

// Define the Content Security Policy
const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline';
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data: https:;
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    media-src 'self' https: https://media.socialbuzz.me;
    connect-src 'self'
      wss://sequencer.socialbuzz.me
      https://sequencer.socialbuzz.me
      https://scraper.socialbuzz.me
      https://mainnet.base.org
      https://cca-lite.coinbase.com
      https://api.web3modal.org;
`.replace(/\s{2,}/g, ' ').trim();

const nextConfig = {
  // Remote images (used by Next <Image>)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'media.socialbuzz.me',
        port: '',
        pathname: '/**',
      },
    ],
  },

  // Add CSP headers globally
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: cspHeader,
          },
        ],
      },
    ];
  },
};

export default nextConfig;
