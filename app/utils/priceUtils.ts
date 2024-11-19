import axios from 'axios';
import { ETH_ADDRESS } from '@app/constants';

// Add these constants
const NATIVE_SOL_ADDRESS = '11111111111111111111111111111111';
const WRAPPED_SOL_ADDRESS = 'So11111111111111111111111111111111111111112';

export const fetchEthPrice = async (): Promise<number> => {
  try {
    const response = await axios.get('/api/coingecko', {
      params: {
        endpoint: 'simple/price',
        ids: 'ethereum',
        vs_currencies: 'usd'
      }
    });
    return response.data.ethereum.usd;
  } catch (error) {
    console.error('Error fetching ETH price:', error);
    return 0;
  }
};

export const fetchTokenPrice = async (tokenAddress: string, network: string): Promise<number> => {
  try {
    if (!tokenAddress) return 0;
    
    if (network === 'solana') {
      // Handle native SOL by using Wrapped SOL address
      const addressToUse = tokenAddress === NATIVE_SOL_ADDRESS ? WRAPPED_SOL_ADDRESS : tokenAddress;
      
      // Use Jupiter API for Solana tokens
      const response = await axios.get('https://price.jup.ag/v4/price', {
        params: {
          ids: addressToUse
        }
      });
      
      if (response.data.data[addressToUse]) {
        return response.data.data[addressToUse].price;
      }
      return 0;
    } else {
      // Use CoinGecko API for EVM tokens
      const response = await axios.get('/api/coingecko', {
        params: {
          endpoint: 'simple/token_price/ethereum',
          contract_addresses: tokenAddress,
          vs_currencies: 'usd'
        }
      });

      // Handle ETH price separately
      if (tokenAddress.toLowerCase() === ETH_ADDRESS.toLowerCase()) {
        const ethResponse = await axios.get('/api/coingecko', {
          params: {
            endpoint: 'simple/price',
            ids: 'ethereum',
            vs_currencies: 'usd'
          }
        });
        return ethResponse.data.ethereum.usd;
      }

      const price = response.data[tokenAddress.toLowerCase()]?.usd;
      return price || 0;
    }
  } catch (error) {
    console.error("Error fetching token price:", error);
    if (axios.isAxiosError(error)) {
      console.error("Response data:", error.response?.data);
      console.error("Response status:", error.response?.status);
    }
    return 0;
  }
};

// Helper function to format USD values
export const formatUSDValue = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};