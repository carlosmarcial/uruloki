import { getDefaultWallets } from '@rainbow-me/rainbowkit';
import { http, createConfig } from 'wagmi';
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
  description: "My App description",
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

// Remove configureChains as it's no longer needed in the latest Wagmi version

const { wallets } = getDefaultWallets({
  appName: metadata.name,
  projectId,
  chains: networks,
});

// Create the Wagmi config
export const wagmiConfig = createConfig({
  chains: networks,
  transports: {
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [optimism.id]: http(),
    [arbitrum.id]: http(),
    [base.id]: http(),
  },
  connectors: wallets,
});

// Add type declaration merging for global inference
declare module 'wagmi' {
  interface Register {
    config: typeof wagmiConfig
  }
}

// Create wagmiAdapter
const wagmiAdapter = new WagmiAdapter({
  ssr: true,
  networks,
  projectId
});

export const reownConfig = wagmiAdapter.wagmiConfig;

// Export the config for use with wagmi CLI
export default {
  out: 'src/generated.ts',
  plugins: [{ name: 'react' }],
};