import { Token } from '../types/token';

export async function fetchTokenList(): Promise<Token[]> {
  const response = await fetch('https://tokens.sushi.com/v0');
  const data = await response.json();
  return data.tokens;
}