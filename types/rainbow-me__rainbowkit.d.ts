declare module '@rainbow-me/rainbowkit' {
  export function ConnectButton(): JSX.Element;
  export function RainbowKitProvider(props: any): JSX.Element;
  
  export interface ConnectButtonProps {
    account?: {
      address: string;
      balanceDecimals?: number;
      balanceFormatted?: string;
      balanceSymbol?: string;
      displayBalance?: string;
      displayName: string;
      ensAvatar?: string;
      ensName?: string;
      hasPendingTransactions: boolean;
    };
    chain?: {
      hasIcon: boolean;
      iconUrl?: string;
      iconBackground?: string;
      id: number;
      name?: string;
      unsupported?: boolean;
    };
    mounted: boolean;
    openAccountModal: () => void;
    openChainModal: () => void;
    openConnectModal: () => void;
    wallet?: {
      connector: any;
      id: string;
      name: string;
      shortName?: string;
      iconUrl: string;
    };
  }
}