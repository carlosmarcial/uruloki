import { Token } from '../types/token';

export async function fetchTokenList(): Promise<Token[]> {
  try {
    const response = await fetch('https://token-list.sushi.com');
    if (!response.ok) {
      throw new Error('Failed to fetch token list');
    }
    const data = await response.json();
    return data.tokens.map((token: any) => ({
      name: token.name,
      symbol: token.symbol,
      address: token.address,
      decimals: token.decimals,
      logoURI: token.logoURI,
      chainId: token.chainId,
    }));
  } catch (error) {
    console.error('Error fetching token list:', error);
    return [];
  }
}

// We don't need a separate function to fetch price and market cap anymore
// as it's included in the main API response