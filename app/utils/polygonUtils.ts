import { POLYGON_CHAIN_ID, TOKEN_LIST_URLS } from '../constants';
import { fetchPrice, fetchQuote } from './swapUtils';
import axios from 'axios';

export const fetchPolygonTokens = async () => {
  try {
    const url = TOKEN_LIST_URLS[POLYGON_CHAIN_ID];
    console.log('Fetching Polygon tokens from:', url);
    
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
    console.log(`Found ${tokens.length} Polygon tokens`);
    return tokens;
  } catch (error) {
    console.error('Error fetching Polygon tokens:', error);
    throw error;
  }
};

export const fetchPolygonPrice = async (
  sellToken: string,
  buyToken: string,
  sellAmount: string,
  taker: string,
  slippageBps: string
) => {
  return fetchPrice(
    POLYGON_CHAIN_ID,
    sellToken,
    buyToken,
    sellAmount,
    taker,
    slippageBps
  );
};

export const fetchPolygonQuote = async (
  sellToken: string,
  buyToken: string,
  sellAmount: string,
  taker: string,
  slippageBps: string
) => {
  return fetchQuote(
    POLYGON_CHAIN_ID,
    sellToken,
    buyToken,
    sellAmount,
    taker,
    slippageBps
  );
};
