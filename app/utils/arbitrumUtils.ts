import { ARBITRUM_CHAIN_ID, TOKEN_LIST_URLS } from '../constants';
import { fetchPrice, fetchQuote } from './swapUtils';
import axios from 'axios';

export const fetchArbitrumTokens = async () => {
  try {
    const url = TOKEN_LIST_URLS[ARBITRUM_CHAIN_ID];
    console.log('Fetching Arbitrum tokens from:', url);
    
    const response = await axios.get(url, {
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });

    if (!response.data?.tokens) {
      throw new Error('Invalid token list format');
    }

    // No need to filter by chainId since these URLs are chain-specific
    const tokens = response.data.tokens;

    console.log(`Found ${tokens.length} Arbitrum tokens`);
    return tokens;
  } catch (error) {
    console.error('Error fetching Arbitrum tokens:', error);
    throw error;
  }
};

export const fetchArbitrumPrice = async (
  sellToken: string,
  buyToken: string,
  sellAmount: string,
  taker: string,
  slippageBps: string
) => {
  return fetchPrice(
    ARBITRUM_CHAIN_ID,
    sellToken,
    buyToken,
    sellAmount,
    taker,
    slippageBps
  );
};

export const fetchArbitrumQuote = async (
  sellToken: string,
  buyToken: string,
  sellAmount: string,
  taker: string,
  slippageBps: string
) => {
  return fetchQuote(
    ARBITRUM_CHAIN_ID,
    sellToken,
    buyToken,
    sellAmount,
    taker,
    slippageBps
  );
};
