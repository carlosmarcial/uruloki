import axios from 'axios';

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

export const fetchTokenPrice = async (tokenAddress: string): Promise<number> => {
  try {
    const response = await axios.get('/api/price', {
      params: {
        sellToken: tokenAddress,
      }
    });
    return response.data.price || 0;
  } catch (error) {
    console.error("Error fetching token price:", error);
    if (axios.isAxiosError(error)) {
      console.error("Response data:", error.response?.data);
      console.error("Response status:", error.response?.status);
    }
    return 0;
  }
};