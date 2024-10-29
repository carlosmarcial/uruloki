import axios from 'axios';
import { ZEROX_API_URL } from '../constants';
import { PriceResponse, QuoteResponse } from './types';

const headers = {
  '0x-api-key': process.env.NEXT_PUBLIC_ZEROX_API_KEY || '',
  '0x-version': 'v2'
};

export const fetchPrice = async (
  chainId: number,
  sellToken: string,
  buyToken: string,
  sellAmount: string,
  taker: string,
  slippageBps: string = '100'
): Promise<PriceResponse> => {
  try {
    const response = await axios.get(`${ZEROX_API_URL}/swap/permit2/price`, {
      params: {
        chainId,
        sellToken,
        buyToken,
        sellAmount,
        taker,
        slippageBps
      },
      headers
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching price:', error);
    throw error;
  }
};

export const fetchQuote = async (
  chainId: number,
  sellToken: string,
  buyToken: string,
  sellAmount: string,
  taker: string,
  slippageBps: string = '100'
): Promise<QuoteResponse> => {
  try {
    const response = await axios.get(`${ZEROX_API_URL}/swap/permit2/quote`, {
      params: {
        chainId,
        sellToken,
        buyToken,
        sellAmount,
        taker,
        slippageBps,
        intentOnFilling: 'true'
      },
      headers
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching quote:', error);
    throw error;
  }
}; 