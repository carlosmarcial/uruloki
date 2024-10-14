'use client'

import React from 'react';
import { Inter } from "next/font/google";
import "../styles/global.css";
import SolanaProvider from "./components/SolanaProvider";
import Script from 'next/script';
import '@rainbow-me/rainbowkit/styles.css';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { createConfig, WagmiConfig } from 'wagmi';
import { mainnet, polygon, optimism, arbitrum } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http } from 'viem';
import WebGLBackground from './components/WebGLBackground';
import { Providers } from './providers';
import Header from './components/Header';
import { WagmiProvider } from 'wagmi';

const inter = Inter({ subsets: ["latin"] });

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SolanaProvider>
          <Providers>{children}</Providers>
        </SolanaProvider>
      </body>
    </html>
  );
}
