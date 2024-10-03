'use client'

import { Inter } from "next/font/google";
import "../styles/global.css";
import SolanaProvider from "./components/SolanaProvider";
import Script from 'next/script';
import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultWallets, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { createConfig, WagmiConfig } from 'wagmi';
import { mainnet, polygon, optimism, arbitrum } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http } from 'viem';

const inter = Inter({ subsets: ["latin"] });

const { wallets } = getDefaultWallets({
  appName: 'Uruloki',
  projectId: process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || '',
  chains: [mainnet, polygon, optimism, arbitrum],
});

const config = createConfig({
  chains: [mainnet, polygon, optimism, arbitrum],
  transports: {
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [optimism.id]: http(),
    [arbitrum.id]: http(),
  },
});

const queryClient = new QueryClient();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <Script src="/tradingview-screenshot.js" strategy="afterInteractive" />
      </head>
      <body className={`${inter.className}`}>
        <WagmiConfig config={config}>
          <QueryClientProvider client={queryClient}>
            <RainbowKitProvider chains={config.chains}>
              <SolanaProvider>
                {children}
              </SolanaProvider>
            </RainbowKitProvider>
          </QueryClientProvider>
        </WagmiConfig>
      </body>
    </html>
  );
}