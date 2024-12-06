export interface TokenData {
  address: `0x${string}` | string;
  chainId: number;
  name: string;
  symbol: string;
  decimals: number;
  logoURI: string;
  _timestamp?: number;
  tags?: string[];
  extensions?: {
    [key: string]: string | number | boolean | null;
  };
}

export interface SolanaToken {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI: string;
  tags?: string[];
  daily_volume?: number;
} 