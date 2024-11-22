import axios from 'axios';
import { retry } from './retry';

export const fetchTokenPrice = async (tokenAddress: string, chain: string) => {
  try {
    // Use Jupiter API for Solana tokens
    if (chain === 'solana') {
      const response = await axios.get('https://price.jup.ag/v4/price', {
        params: {
          ids: tokenAddress
        }
      });
      
      if (response.data?.data?.[tokenAddress]?.price) {
        return response.data.data[tokenAddress].price;
      }
      return 0;
    }

    // Use CoinGecko for Ethereum tokens
    const response = await retry(
      async () => axios.get('/api/coingecko', {
        params: {
          endpoint: 'simple/token_price/ethereum',
          contract_addresses: tokenAddress,
          vs_currencies: 'usd'
        }
      }),
      {
        retries: 2,
        minTimeout: 2000,
        factor: 2
      }
    );

    if (response.data.error) {
      console.warn('Price fetch warning:', response.data.error);
      return 0;
    }

    const price = response.data[tokenAddress.toLowerCase()]?.usd;
    return price || 0;
  } catch (error: any) {
    console.error('Error fetching token price:', error);
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