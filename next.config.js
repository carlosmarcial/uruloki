const path = require('path'); // Add this line

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'assets.coingecko.com',
      'raw.githubusercontent.com',
      'cdn.sushi.com',
      's2.coinmarketcap.com',
      'assets.trustwalletapp.com',
      'tokens.1inch.io',
      'logos.covalenthq.com',
      'jpyc.jp',
      'assets.coingecko.com',
      'ethereum-optimism.github.io',
      'cryptologos.cc',
      'assets.spookyswap.finance',
      'app.uniswap.org',
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname),
    }
    return config
  },
}

module.exports = nextConfig