import { ARBITRUM_CHAIN_ID, TOKEN_LIST_URLS } from '../constants';
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

export const fetchArbitrumPrice = async (params: any) => {
  try {
    const response = await axios.get('https://api.0x.org/swap/v2/price', {
      params: {
        ...params,
        chainId: ARBITRUM_CHAIN_ID
      },
      headers: {
        '0x-api-key': process.env.ZEROX_API_KEY,
        '0x-version': 'v2'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching Arbitrum price:', error);
    throw error;
  }
};

export const fetchArbitrumQuote = async (params: any) => {
  try {
    const response = await axios.get('https://api.0x.org/swap/v2/quote', {
      params: {
        ...params,
        chainId: ARBITRUM_CHAIN_ID
      },
      headers: {
        '0x-api-key': process.env.ZEROX_API_KEY,
        '0x-version': 'v2'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching Arbitrum quote:', error);
    throw error;
  }
};

// Add Arbitrum-specific constants
export const ARBITRUM_PERMIT2_ADDRESS = '0x000000000022D473030F116dDEE9F6B43aC78BA3'; // Same as Ethereum
export const ARBITRUM_ALLOWANCE_HOLDER = '0x0000000000001fF3684f28c67538d4D072C22734'; // Same as Ethereum

// Add helper function to check if a token needs WETH handling
export const isNativeToken = (address: string) => {
  return address.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
};

// Add helper function to format token addresses
export const formatTokenAddress = (address: string) => {
  return isNativeToken(address) ? 'WETH' : address;
};
