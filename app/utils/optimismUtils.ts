import { OPTIMISM_CHAIN_ID, TOKEN_LIST_URLS } from '../constants';
import { fetchPrice, fetchQuote } from './swapUtils';
import axios from 'axios';

export const fetchOptimismTokens = async () => {
  try {
    const url = TOKEN_LIST_URLS[OPTIMISM_CHAIN_ID];
    console.log('Fetching Optimism tokens from:', url);
    
    const response = await axios.get(url, {
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });

    if (!response.data?.tokens) {
      throw new Error('Invalid token list format');
    }

    const tokens = response.data.tokens;
    console.log(`Found ${tokens.length} Optimism tokens`);
    return tokens;
  } catch (error) {
    console.error('Error fetching Optimism tokens:', error);
    throw error;
  }
};

export const fetchOptimismPrice = async (
  sellToken: string,
  buyToken: string,
  sellAmount: string,
  taker: string,
  slippageBps: string
) => {
  return fetchPrice(
    OPTIMISM_CHAIN_ID,
    sellToken,
    buyToken,
    sellAmount,
    taker,
    slippageBps
  );
};

export const fetchOptimismQuote = async (
  sellToken: string,
  buyToken: string,
  sellAmount: string,
  taker: string,
  slippageBps: string
) => {
  return fetchQuote(
    OPTIMISM_CHAIN_ID,
    sellToken,
    buyToken,
    sellAmount,
    taker,
    slippageBps
  );
};
