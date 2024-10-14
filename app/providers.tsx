"use client";

import { useState } from 'react';
import { getDefaultConfig, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import { WagmiProvider } from 'wagmi';
import { mainnet, polygon, optimism, arbitrum, base } from 'wagmi/chains';
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import ModelPreloader from '@app/components/ModelPreloader';

// Ensure you have this type for the environment variable
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_REOWN_PROJECT_ID: string;
    }
  }
}

const config = getDefaultConfig({
  appName: 'Uruloki',
  projectId: process.env.NEXT_PUBLIC_REOWN_PROJECT_ID,
  chains: [mainnet, polygon, optimism, arbitrum, base],
  ssr: true, // Enable server-side rendering mode
});

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider chains={config.chains}>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}