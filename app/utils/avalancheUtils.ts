import { AVALANCHE_CHAIN_ID, ZEROX_BASE_URLS } from '../constants';
import { PriceResponse, QuoteResponse } from '../utils/types';
import axios from 'axios';

export const getAvalancheApiUrl = () => ZEROX_BASE_URLS[AVALANCHE_CHAIN_ID];

export const fetchAvalanchePrice = async (
  sellToken: string,
  buyToken: string,
  sellAmount: string,
  takerAddress: string,
  slippagePercentage: string
): Promise<PriceResponse> => {
  const baseUrl = getAvalancheApiUrl();
  
  try {
    const response = await axios.get(`${baseUrl}/swap/v1/price`, {
      params: {
        sellToken,
        buyToken,
        sellAmount,
        takerAddress,
        slippagePercentage,
      },
      headers: {
        '0x-api-key': process.env.ZEROX_API_KEY,
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching Avalanche price:', error);
    throw error;
  }
};

export const fetchAvalancheQuote = async (
  sellToken: string,
  buyToken: string,
  sellAmount: string,
  takerAddress: string,
  slippagePercentage: string
): Promise<QuoteResponse> => {
  const baseUrl = getAvalancheApiUrl();
  
  try {
    const response = await axios.get(`${baseUrl}/swap/v1/quote`, {
      params: {
        sellToken,
        buyToken,
        sellAmount,
        takerAddress,
        slippagePercentage,
        chainId: AVALANCHE_CHAIN_ID,
      },
      headers: {
        '0x-api-key': process.env.NEXT_PUBLIC_0X_API_KEY,
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching Avalanche quote:', error);
    throw error;
  }
};

