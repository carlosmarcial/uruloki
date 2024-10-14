/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    return config;
  },
  images: {
    domains: [
      'assets.coingecko.com',
      'ethereum.org',
      'raw.githubusercontent.com',
      'ipfs.nftstorage.link',
      'ipfs.io',
      'arweave.net',
      'storage.googleapis.com',
      'assets.blocksmithlabs.io',
      'dl.airtable.com',
      'media.discordapp.net',
      'images-ext-1.discordapp.net',
      'cdn.discordapp.com',
      'turquoise-worried-llama-208.mypinata.cloud',
      'shop.alienchickenfarm.com',
      'gateway.ipfscdn.io',
      'public.djib.io',
      'chintai.io',
      'scontent.fcrk3-2.fna.fbcdn.net',
      'imageupload.io',
      'image-cdn.solana.fm',
      'github.com',
      'cf-ipfs.com',
      'superfast.org',
      'markets.clone.so',
      'metaseer.io',
      'assets.blockstars.gg',
      'wrap.dingocoin.org',
      'emerald-kind-bug-210.mypinata.cloud',
      'coffee-deliberate-clam-397.mypinata.cloud'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.ipfs.nftstorage.link',
      },
      {
        protocol: 'https',
        hostname: 'ipfs.io',
        pathname: '/ipfs/**',
      },
      {
        protocol: 'https',
        hostname: '**.arweave.net',
      },
      {
        protocol: 'https',
        hostname: '**.mypinata.cloud',
      },
      {
        protocol: 'https',
        hostname: '**.ipfs.cf-ipfs.com',
      },
      {
        protocol: 'https',
        hostname: '**.fbcdn.net',
      },
      {
        protocol: 'https',
        hostname: '**.discordapp.net',
      },
      {
        protocol: 'https',
        hostname: '**.discordapp.com',
      },
    ],
  },
};

module.exports = nextConfig;
