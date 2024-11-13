import { ZEROX_API_URLS, ZEROX_API_VERSIONS } from '../constants';
import axios from 'axios';
import { parseUnits } from 'ethers';

export const fetchPrice = async (
  chainId: number,
  sellToken: string,
  buyToken: string,
  sellAmount: string,
  takerAddress: string,
  slippageBps: string = '50'
) => {
  const apiVersion = ZEROX_API_VERSIONS[chainId] || 'v1';
  const baseUrl = ZEROX_API_URLS[chainId];
  
  if (!baseUrl) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }

  const params = apiVersion === 'v2' ? {
    chainId,
    sellToken,
    buyToken,
    sellAmount,
    taker: takerAddress,
    swapFeeRecipient: process.env.NEXT_PUBLIC_FEE_RECIPIENT,
    swapFeeBps: '100',
    swapFeeToken: buyToken,
    enableSlippageProtection: false
  } : {
    sellToken,
    buyToken,
    sellAmount,
    takerAddress,
    affiliateAddress: process.env.NEXT_PUBLIC_FEE_RECIPIENT,
    affiliateFeeBasisPoints: '100',
    skipValidation: false,
    slippagePercentage: (Number(slippageBps) / 10000).toString()
  };

  try {
    const endpoint = apiVersion === 'v2' ? '/swap/v1/price' : '/price';
    const response = await axios.get(`${baseUrl}${endpoint}`, {
      params,
      headers: {
        '0x-api-key': process.env.ZEROX_API_KEY || '',
      }
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
  takerAddress: string,
  slippageBps: string = '50'
) => {
  const apiVersion = ZEROX_API_VERSIONS[chainId] || 'v1';
  const baseUrl = ZEROX_API_URLS[chainId];
  
  if (!baseUrl) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }

  const params = apiVersion === 'v2' ? {
    chainId,
    sellToken,
    buyToken,
    sellAmount,
    taker: takerAddress,
    swapFeeRecipient: process.env.NEXT_PUBLIC_FEE_RECIPIENT,
    swapFeeBps: '100',
    swapFeeToken: buyToken,
    enableSlippageProtection: false
  } : {
    sellToken,
    buyToken,
    sellAmount,
    takerAddress,
    affiliateAddress: process.env.NEXT_PUBLIC_FEE_RECIPIENT,
    affiliateFeeBasisPoints: '100',
    skipValidation: false,
    slippagePercentage: (Number(slippageBps) / 10000).toString()
  };

  try {
    const response = await axios.get(`${baseUrl}/swap/v1/quote`, {
      params,
      headers: {
        '0x-api-key': process.env.ZEROX_API_KEY || '',
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching quote:', error);
    throw error;
  }
}; 