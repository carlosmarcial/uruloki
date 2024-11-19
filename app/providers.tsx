"use client";

import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import { WagmiConfig } from 'wagmi';
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import ModelPreloader from '@app/components/ModelPreloader';
import SolanaProvider from './components/SolanaProvider';
import { wagmiConfig } from './wagmi';

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiConfig config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider 
          theme={darkTheme({
            accentColor: '#77be44',
            accentColorForeground: 'white',
            borderRadius: 'small'
          })}
          modalSize="compact"
        >
          <SolanaProvider>
            <ModelPreloader />
            {children}
          </SolanaProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiConfig>
  );
}
