import { createConfig, http } from 'wagmi';
import { mainnet, polygon, optimism, arbitrum, base, avalanche, bsc, linea, mantle, scroll } from 'wagmi/chains';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';

if (!process.env.NEXT_PUBLIC_REOWN_PROJECT_ID) {
  throw new Error('NEXT_PUBLIC_REOWN_PROJECT_ID is not defined');
}

export const wagmiConfig = getDefaultConfig({
  appName: 'Uruloki',
  projectId: process.env.NEXT_PUBLIC_REOWN_PROJECT_ID,
  chains: [
    mainnet, 
    polygon, 
    optimism, 
    arbitrum, 
    base, 
    avalanche, 
    bsc, 
    linea, 
    mantle, 
    scroll
  ],
  transports: {
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [optimism.id]: http(),
    [arbitrum.id]: http(),
    [base.id]: http(),
    [avalanche.id]: http(),
    [bsc.id]: http(),
    [linea.id]: http(),
    [mantle.id]: http(),
    [scroll.id]: http(),
  },
  ssr: true
}); 