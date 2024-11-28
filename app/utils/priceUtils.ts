import axios from 'axios';
import { retry } from './retry';

const CACHE_DURATION = 60000; // 1 minute
const priceCache = new Map<string, { price: number; timestamp: number }>();

export const fetchTokenPrice = async (tokenAddress: string, chain: string) => {
  try {
    // Check cache first
    const cached = priceCache.get(tokenAddress);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.price;
    }

    // Use Jupiter API for Solana tokens
    if (chain === 'solana') {
      const response = await axios.get('https://price.jup.ag/v4/price', {
        params: {
          ids: tokenAddress
        }
      });
      
      if (response.data?.data?.[tokenAddress]?.price) {
        const price = response.data.data[tokenAddress].price;
        priceCache.set(tokenAddress, { price, timestamp: Date.now() });
        return price;
      }
      return 0;
    }

    // For Ethereum tokens, use cached price if CoinGecko fails
    try {
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

      if (response.data[tokenAddress.toLowerCase()]?.usd) {
        const price = response.data[tokenAddress.toLowerCase()].usd;
        priceCache.set(tokenAddress, { price, timestamp: Date.now() });
        return price;
      }
    } catch (error) {
      console.warn('CoinGecko API error, using cached price if available:', error);
      if (cached) {
        return cached.price;
      }
    }

    return 0;
  } catch (error: any) {
    console.error('Error fetching token price:', error);
    // Return cached price if available, otherwise 0
    return priceCache.get(tokenAddress)?.price || 0;
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