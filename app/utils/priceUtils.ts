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

    // Special handling for ETH
    if (tokenAddress.toLowerCase() === 'eth' || 
        tokenAddress.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
      try {
        const response = await axios.get('/api/coingecko', {
          params: {
            endpoint: 'simple/price',
            ids: 'ethereum',
            vs_currencies: 'usd'
          }
        });

        if (response.data?.ethereum?.usd) {
          const price = response.data.ethereum.usd;
          priceCache.set(tokenAddress, { price, timestamp: Date.now() });
          return price;
        }
      } catch (error) {
        console.warn('Error fetching ETH price from CoinGecko:', error);
        // Fall back to cached price if available
        if (cached) return cached.price;
      }
    }

    // For Solana tokens
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

    // For ERC20 tokens
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
      if (cached) return cached.price;
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
  if (!value) return '$0.00';
  
  // Convert to string and remove existing commas
  const cleanValue = value.toString().replace(/,/g, '');
  
  // Split into whole and decimal parts
  const [wholePart, decimalPart] = cleanValue.split('.');
  
  // Add commas to whole number part
  const formattedWholePart = wholePart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  // If number is >= 1, limit to 2 decimal places
  if (Math.abs(value) >= 1) {
    return `$${formattedWholePart}${decimalPart ? `.${decimalPart.slice(0, 2)}` : '.00'}`;
  }
  
  // For numbers < 1, keep all decimal places
  return `$${formattedWholePart}${decimalPart ? `.${decimalPart}` : '.00'}`;
};