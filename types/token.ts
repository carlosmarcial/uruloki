export interface Token {
  name: string;
  symbol: string;
  address: string;
  decimals: number;
  logoURI?: string;
  chainId: number;
  balance?: number;
  price?: number;
  logo?: string;
}