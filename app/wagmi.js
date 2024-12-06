import { createConfig, http } from 'wagmi';
import { mainnet, polygon, optimism, arbitrum, avalanche } from 'wagmi/chains';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';

if (!process.env.NEXT_PUBLIC_REOWN_PROJECT_ID) {
  throw new Error('NEXT_PUBLIC_REOWN_PROJECT_ID is not defined');
}

const chains = [mainnet, polygon, optimism, arbitrum, avalanche];

export const wagmiConfig = getDefaultConfig({
  appName: 'Uruloki',
  projectId: process.env.NEXT_PUBLIC_REOWN_PROJECT_ID,
  chains,
  transports: {
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [optimism.id]: http(),
    [arbitrum.id]: http(),
    [avalanche.id]: http()
  },
  ssr: true
}); 