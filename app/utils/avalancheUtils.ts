import { AVALANCHE_CHAIN_ID, TOKEN_LIST_URLS, AVALANCHE_TOKENS } from '../constants';
import { fetchPrice, fetchQuote } from './swapUtils';
import axios from 'axios';

export const fetchAvalancheTokens = async () => {
  try {
    const url = TOKEN_LIST_URLS[AVALANCHE_CHAIN_ID];
    console.log('Fetching Avalanche tokens from:', url);
    
    const response = await axios.get(url);
    
    if (!response.data?.tokens) {
      throw new Error('Invalid token list format');
    }

    const fetchedTokens = response.data.tokens;
    const allTokens = [...AVALANCHE_TOKENS, ...fetchedTokens];
    
    const uniqueTokens = allTokens.filter((token, index, self) => 
      index === self.findIndex(t => 
        t.address.toLowerCase() === token.address.toLowerCase()
      )
    );

    console.log(`Found ${uniqueTokens.length} Avalanche tokens (including predefined tokens)`);
    return uniqueTokens;
  } catch (error) {
    console.error('Error fetching Avalanche tokens:', error);
    return AVALANCHE_TOKENS;
  }
};

export const fetchAvalanchePrice = async (
  sellToken: string,
  buyToken: string,
  sellAmount: string,
  taker: string,
  slippageBps: string
) => {
  return fetchPrice(
    AVALANCHE_CHAIN_ID,
    sellToken,
    buyToken,
    sellAmount,
    taker,
    slippageBps
  );
};

export const fetchAvalancheQuote = async (
  sellToken: string,
  buyToken: string,
  sellAmount: string,
  taker: string,
  slippageBps: string
) => {
  return fetchQuote(
    AVALANCHE_CHAIN_ID,
    sellToken,
    buyToken,
    sellAmount,
    taker,
    slippageBps
  );
};
