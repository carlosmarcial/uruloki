import { Token } from '../types/token';

export async function fetchTokenList(chainId: number): Promise<Token[]> {
  // Replace this URL with the actual API endpoint for fetching tokens
  const response = await fetch(`https://api.example.com/tokens?chainId=${chainId}`);
  const data = await response.json();
  return data.tokens;
}