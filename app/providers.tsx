"use client";

import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import type { Theme as RainbowKitTheme } from '@rainbow-me/rainbowkit/dist/components/RainbowKitProvider/RainbowKitProvider';
import '@rainbow-me/rainbowkit/styles.css';
import { WagmiProvider } from 'wagmi';
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import ModelPreloader from '@app/components/ModelPreloader';
import SolanaProvider from './components/SolanaProvider';
import { wagmiConfig } from './wagmi.js';

const queryClient = new QueryClient();

// Create a custom dark theme
const customDarkTheme: RainbowKitTheme = {
  blurs: {
    modalOverlay: 'blur(8px)',
  },
  colors: {
    accentColor: '#77be44',
    accentColorForeground: 'white',
    actionButtonBorder: 'none',
    actionButtonBorderMobile: 'none',
    actionButtonSecondaryBackground: 'rgba(0, 0, 0, 0.1)',
    closeButton: 'rgba(255, 255, 255, 0.8)',
    closeButtonBackground: 'rgba(0, 0, 0, 0.1)',
    connectButtonBackground: '#77be44',
    connectButtonBackgroundError: '#FF494A',
    connectButtonInnerBackground: 'linear-gradient(0deg, rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.1))',
    connectButtonText: 'white',
    connectButtonTextError: 'white',
    connectionIndicator: '#77be44',
    downloadBottomCardBackground: 'linear-gradient(126deg, rgba(0, 0, 0, 0) 9.49%, rgba(120, 190, 69, 0.1) 71.04%)',
    downloadTopCardBackground: 'linear-gradient(126deg, rgba(120, 190, 69, 0.1) 9.49%, rgba(0, 0, 0, 0) 71.04%)',
    error: '#FF494A',
    generalBorder: 'rgba(255, 255, 255, 0.08)',
    generalBorderDim: 'rgba(255, 255, 255, 0.04)',
    menuItemBackground: 'rgba(0, 0, 0, 0.1)',
    modalBackground: '#1a1b1f',
    modalBackdrop: 'rgba(0, 0, 0, 0.5)',
    modalBorder: 'rgba(255, 255, 255, 0.08)',
    modalText: 'white',
    modalTextDim: 'rgba(255, 255, 255, 0.6)',
    modalTextSecondary: 'rgba(255, 255, 255, 0.6)',
    profileAction: 'rgba(255, 255, 255, 0.1)',
    profileActionHover: 'rgba(255, 255, 255, 0.2)',
    profileForeground: 'rgba(0, 0, 0, 0.1)',
    selectedOptionBorder: 'rgba(119, 190, 68, 0.1)',
    standby: '#FFD641',
  },
  fonts: {
    body: 'Inter, sans-serif',
  },
  radii: {
    actionButton: 'small',
    connectButton: 'small',
    menuButton: 'small',
    modal: '20px',
    modalMobile: '20px',
  },
  shadows: {
    connectButton: 'none',
    dialog: '0px 4px 12px rgba(0, 0, 0, 0.1)',
    profileDetailsAction: 'none',
    selectedOption: '0px 4px 12px rgba(0, 0, 0, 0.1)',
    selectedWallet: '0px 4px 12px rgba(0, 0, 0, 0.1)',
    walletLogo: '0px 4px 12px rgba(0, 0, 0, 0.1)',
  },
};

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider 
          theme={customDarkTheme}
          modalSize="compact"
        >
          <SolanaProvider>
            <ModelPreloader />
            {children}
          </SolanaProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
