import { ZEROX_API_URLS, ZEROX_API_VERSIONS } from '../constants';
import axios from 'axios';
import { parseUnits } from 'ethers';

export const fetchPrice = async (
  chainId: number,
  sellToken: string,
  buyToken: string,
  sellAmount: string,
  taker: string,
  slippageBps: string
) => {
  try {
    const apiUrl = ZEROX_API_URLS[chainId];
    const apiVersion = ZEROX_API_VERSIONS[chainId];
    
    if (!apiUrl) {
      throw new Error(`Unsupported chain ID: ${chainId}`);
    }

    const headers = {
      '0x-api-key': process.env.NEXT_PUBLIC_ZEROX_API_KEY || '',
      ...(apiVersion === 'v2' ? { '0x-version': 'v2' } : {})
    };

    const params = apiVersion === 'v2' ? {
      chainId,
      sellToken,
      buyToken,
      sellAmount,
      taker,
      slippageBps
    } : {
      sellToken,
      buyToken,
      sellAmount,
      takerAddress: taker
    };

    const endpoint = apiVersion === 'v2' ? '/swap/permit2/price' : '/swap/v1/price';
    
    const response = await axios.get(`${apiUrl}${endpoint}`, {
      params,
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
  slippageBps: string
) => {
  try {
    const apiUrl = ZEROX_API_URLS[chainId];
    const apiVersion = ZEROX_API_VERSIONS[chainId];
    
    if (!apiUrl) {
      throw new Error(`Unsupported chain ID: ${chainId}`);
    }

    const sellAmountInBaseUnits = sellAmount.includes('.')
      ? parseUnits(sellAmount, 6).toString()
      : sellAmount + '000000';

    console.log('Formatted sell amount:', sellAmountInBaseUnits);

    const headers = {
      '0x-api-key': process.env.NEXT_PUBLIC_ZEROX_API_KEY || '',
      ...(apiVersion === 'v2' ? { '0x-version': 'v2' } : {})
    };

    let params;
    if (apiVersion === 'v2') {
      params = {
        chainId,
        sellToken,
        buyToken,
        sellAmount: sellAmountInBaseUnits,
        taker,
        slippageBps: '100'
      };
    } else {
      params = {
        sellToken,
        buyToken,
        sellAmount: sellAmountInBaseUnits,
        takerAddress: taker,
        skipValidation: true,
        slippagePercentage: '0.01',
        enableSlippageProtection: false,
        feeRecipient: process.env.NEXT_PUBLIC_FEE_RECIPIENT,
        buyTokenPercentageFee: '0.01'
      };
    }

    const endpoint = apiVersion === 'v2' ? '/swap/permit2/quote' : '/swap/v1/quote';
    
    console.log('Fetching quote with:', {
      url: `${apiUrl}${endpoint}`,
      params,
      headers
    });

    const response = await axios.get(`${apiUrl}${endpoint}`, {
      params,
      headers
    });

    console.log('Quote response:', response.data);

    if (!response.data || !response.data.price) {
      console.error('Invalid quote response:', response.data);
      throw new Error('Invalid quote response structure');
    }

    return response.data;
  } catch (error: any) {
    console.error('Error fetching quote:', error);
    if (error.response) {
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
      console.error('Error response headers:', error.response.headers);
    }
    throw error;
  }
}; 