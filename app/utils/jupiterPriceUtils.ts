import axios from 'axios';

const JUPITER_PRICE_API = 'https://price.jup.ag/v4/price';
const priceCache = new Map<string, { price: number; timestamp: number }>();
const CACHE_DURATION = 60000; // 1 minute cache duration

export const getCachedJupiterPrice = (tokenAddress: string): number | null => {
  const cached = priceCache.get(tokenAddress);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.price;
  }
  return null;
};

export const fetchJupiterPrice = async (tokenAddress: string) => {
  try {
    // Check cache first
    const cachedPrice = getCachedJupiterPrice(tokenAddress);
    if (cachedPrice !== null) {
      return cachedPrice;
    }

    // If not in cache, fetch from Jupiter API
    const response = await axios.get(JUPITER_PRICE_API, {
      params: {
        ids: tokenAddress,
        vsToken: 'USDC' // Always get price in USDC
      }
    });

    if (response.data?.data?.[tokenAddress]?.price) {
      const price = response.data.data[tokenAddress].price;
      // Cache the price
      priceCache.set(tokenAddress, {
        price,
        timestamp: Date.now()
      });
      return price;
    }

    return 0;
  } catch (error) {
    console.error('Error fetching Jupiter price:', error);
    return 0;
  }
}; 