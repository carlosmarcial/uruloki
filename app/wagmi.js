import { createConfig, http } from 'wagmi';
import { mainnet, polygon, optimism, arbitrum, avalanche } from 'wagmi/chains';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';

if (!process.env.NEXT_PUBLIC_REOWN_PROJECT_ID) {
  throw new Error('NEXT_PUBLIC_REOWN_PROJECT_ID is not defined');
}

if (!process.env.NEXT_PUBLIC_ALCHEMY_API_KEY) {
  throw new Error('NEXT_PUBLIC_ALCHEMY_API_KEY is not defined');
}

const ALCHEMY_RPC_URL = `https://eth-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`;

// Configure mainnet with Alchemy RPC
const mainnetWithAlchemy = {
  ...mainnet,
  rpcUrls: {
    ...mainnet.rpcUrls,
    default: {
      http: [ALCHEMY_RPC_URL],
    },
    public: {
      http: [ALCHEMY_RPC_URL],
    },
  },
};

const chains = [mainnetWithAlchemy, polygon, optimism, arbitrum, avalanche];

export const wagmiConfig = getDefaultConfig({
  appName: 'Uruloki',
  projectId: process.env.NEXT_PUBLIC_REOWN_PROJECT_ID,
  chains,
  transports: {
    [mainnet.id]: http(ALCHEMY_RPC_URL),
    [polygon.id]: http(),
    [optimism.id]: http(),
    [arbitrum.id]: http(),
    [avalanche.id]: http()
  },
  ssr: true
}); 