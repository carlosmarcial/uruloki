import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'wagmi';
import { 
  mainnet, 
  polygon, 
  optimism, 
  arbitrum, 
  base
} from 'wagmi/chains';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';

// Use the Reown project ID from your .env.local
export const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || 'a1a360949d859cdef8a48cbb27879c6d';

export const metadata = {
  name: "Uruloki",
  description: "On-chain DEX aggregator for Ethereum and Solana",
  url: "https://uruloki.app",
  icons: ["public/logo.svg"]
};

export const networks = [
  mainnet, 
  polygon, 
  optimism, 
  arbitrum, 
  base
];

// Create the Wagmi config using getDefaultConfig
export const wagmiConfig = getDefaultConfig({
  appName: metadata.name,
  projectId,
  chains: networks,
  transports: {
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [optimism.id]: http(),
    [arbitrum.id]: http(),
    [base.id]: http(),
  },
  ssr: true
});

// Create wagmiAdapter with correct CAIP format for network IDs
const wagmiAdapter = new WagmiAdapter({
  ssr: true,
  networks: networks.map(network => ({
    id: `eip155:${network.id}`,  // Format ID according to CAIP
    name: network.name,
    chainId: network.id.toString(),
    chainNamespace: 'evm',
    rpcUrl: network.rpcUrls.default.http[0],
    explorerUrl: network.blockExplorers?.default?.url || '',
    currency: {
      name: network.nativeCurrency.name,
      symbol: network.nativeCurrency.symbol,
      decimals: network.nativeCurrency.decimals
    }
  })),
  projectId
});

export const reownConfig = wagmiAdapter.wagmiConfig;

// Export the config for use with wagmi CLI
export default {
  out: 'src/generated.ts',
  plugins: [{ name: 'react' }],
};