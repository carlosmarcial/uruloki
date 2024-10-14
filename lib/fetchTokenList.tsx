import axios from 'axios';
import { NATIVE_TOKEN_ADDRESS } from '../app/constants/addresses';

export interface Token {
  address: string;
  chainId: number;
  decimals: number;
  name: string;
  symbol: string;
  logoURI: string;
}

export const fetchTokenList = async (chainId: number): Promise<Token[]> => {
  try {
    const response = await axios.get(`https://tokens.coingecko.com/uniswap/all.json`);
    return response.data.tokens.filter((token: Token) => token.chainId === chainId);
  } catch (error) {
    console.error('Error fetching token list:', error);
    return [];
  }
};