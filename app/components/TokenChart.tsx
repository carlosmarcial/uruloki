import React, { forwardRef, useImperativeHandle, useRef, useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import TokenImage from './TokenImage';
import { ETH_ADDRESS } from '@/app/constants';

interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
}

interface TokenChartProps {
  selectedToken: Token | null;
  chainId?: number | string;
  activeChain: 'ethereum' | 'solana';
}

export interface TokenChartRef {
  refreshChart: () => void;
}

interface TokenAnalysis {
  analysis: string;
  loading: boolean;
  error: string | null;
}

interface CachedAnalysis {
  analysis: string;
  timestamp: number;
}

interface AnalysisCache {
  [key: string]: CachedAnalysis;
}

const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds (60 minutes * 60 seconds * 1000 milliseconds)

const WRAPPED_SOL_ADDRESS = 'So11111111111111111111111111111111111111112';
const NATIVE_SOL_ADDRESS = '11111111111111111111111111111111';
const WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'; // Mainnet WETH address

const getCachedAnalysis = (tokenAddress: string, network: string): string | null => {
  try {
    const cache = localStorage.getItem('aiAnalysisCache');
    if (!cache) return null;

    const parsedCache: AnalysisCache = JSON.parse(cache);
    const cacheKey = `${network}-${tokenAddress.toLowerCase()}`;
    const cachedData = parsedCache[cacheKey];

    if (!cachedData) return null;

    // Check if cache has expired
    if (Date.now() - cachedData.timestamp > CACHE_DURATION) {
      // Remove expired cache
      delete parsedCache[cacheKey];
      localStorage.setItem('aiAnalysisCache', JSON.stringify(parsedCache));
      return null;
    }

    return cachedData.analysis;
  } catch (error) {
    console.warn('Error reading from cache:', error);
    return null;
  }
};

const setCachedAnalysis = (tokenAddress: string, network: string, analysis: string) => {
  try {
    const cache = localStorage.getItem('aiAnalysisCache');
    const parsedCache: AnalysisCache = cache ? JSON.parse(cache) : {};
    const cacheKey = `${network}-${tokenAddress.toLowerCase()}`;

    // Add new analysis to cache with current timestamp
    parsedCache[cacheKey] = {
      analysis,
      timestamp: Date.now()
    };

    localStorage.setItem('aiAnalysisCache', JSON.stringify(parsedCache));
  } catch (error) {
    console.warn('Error writing to cache:', error);
  }
};

const StreamingText = ({ text, activeChain }: { text: string; activeChain: 'ethereum' | 'solana' }) => {
  const [displayText, setDisplayText] = useState<string[]>([]);
  
  useEffect(() => {
    const words = text.split(' ');
    const currentDisplayed = displayText.join(' ');
    const remainingText = text.slice(currentDisplayed.length).trim();
    
    if (remainingText) {
      const newWords = remainingText.split(' ');
      if (newWords[0]) {
        const timer = setTimeout(() => {
          setDisplayText(prev => [...prev, newWords[0]]);
        }, 50);
        return () => clearTimeout(timer);
      }
    }
  }, [text, displayText]);

  // Process text to add formatting
  const formatText = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, index) => {
      // Check if line is a heading (starts with a number followed by a period)
      if (/^\d+\./.test(line)) {
        return (
          <div key={index} className="mb-4 mt-8 first:mt-0">
            <span className={`${
              activeChain === 'ethereum' 
                ? 'text-[#77be44]' 
                : 'text-purple-500'
            } font-semibold`}>
              {line}
            </span>
          </div>
        );
      }
      return <div key={index} className="mb-2">{line}</div>;
    });
  };

  return (
    <div className="text-white whitespace-pre-wrap p-4">
      {formatText(displayText.join(' '))}
    </div>
  );
};

const formatPrice = (price: number): string => {
  // Convert to number in case it's a string
  const numPrice = Number(price);
  
  if (isNaN(numPrice)) return '0';

  // For numbers >= 1, show only 2 decimal places
  if (numPrice >= 1) {
    return numPrice.toFixed(2);
  }
  
  // For numbers < 1, we need to analyze the first non-zero decimal place
  const priceStr = numPrice.toString();
  const [, decimals] = priceStr.split('.');
  
  if (!decimals) return numPrice.toFixed(2);

  // Find first non-zero digit position
  const firstNonZero = decimals.split('').findIndex(d => d !== '0');
  
  if (firstNonZero === -1) {
    // If all decimals are zero
    return numPrice.toFixed(2);
  } else {
    // If first non-zero digit is followed by a non-zero digit
    const firstSignificantDigit = parseInt(decimals[firstNonZero]);
    if (firstSignificantDigit > 0) {
      // Show 4 decimal places for numbers like 0.2533
      if (firstNonZero <= 1) {
        return numPrice.toFixed(4);
      }
      // Show 6 decimal places for very small numbers like 0.023229
      return numPrice.toFixed(6);
    }
  }
  
  // Default to 6 decimal places for very small numbers
  return numPrice.toFixed(6);
};

interface GeckoTerminalPool {
  id: string;
  attributes?: {
    name?: string;
    dex_id?: string;
    reserve_in_usd?: string;
    market_cap_usd?: string;
    fdv_usd?: string;
    price_change_percentage?: {
      h1?: number;
      h6?: number;
      h24?: number;
    };
    volume_usd?: {
      h1?: number;
      h6?: number;
      h24?: number;
    };
    transactions?: {
      h24?: {
        buys?: number;
        sells?: number;
        buyers?: number;
        sellers?: number;
      };
    };
  };
}

const TokenChart = forwardRef<TokenChartRef, TokenChartProps>(({ 
  selectedToken, 
  chainId,
  activeChain
}, ref) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chartUrl, setChartUrl] = useState<string>('');
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [analysis, setAnalysis] = useState<TokenAnalysis>({
    analysis: '',
    loading: false,
    error: null
  });
  const [isBlurred, setIsBlurred] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Helper function to get network identifier for GeckoTerminal
  const getNetworkIdentifier = (chainId: number | string | undefined) => {
    switch (chainId) {
      case 1:
        return 'eth';
      case 'solana':
        return 'solana';
      case 56:
        return 'bsc';
      case 137:
        return 'polygon_pos';
      case 42161:
        return 'arbitrum';
      case 43114:
        return 'avax';
      case 10:
        return 'optimism';
      default:
        return 'eth';
    }
  };

  // Format token address according to network requirements
  const formatTokenAddress = (address: string, network: string) => {
    // Handle ETH special case
    if (address.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
      return 'eth';
    }
    
    // For Solana tokens, handle special cases
    if (network === 'solana') {
      // If it's native SOL, use Wrapped SOL address
      if (address === NATIVE_SOL_ADDRESS) {
        return WRAPPED_SOL_ADDRESS;
      }
      // Remove any potential 'spl-' prefix
      const cleanAddress = address.replace('spl-', '');
      return cleanAddress;
    }
    
    // For EVM chains, handle as before
    const cleanAddress = address.toLowerCase().replace('0x', '');
    return `0x${cleanAddress}`;
  };

  const fetchGeckoTerminalUrl = async (token: Token, network: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // If token is ETH, use WETH address for data fetching
      const formattedAddress = token.address.toLowerCase() === ETH_ADDRESS.toLowerCase()
        ? WETH_ADDRESS
        : formatTokenAddress(token.address, network);

      console.log('Fetching pool for:', { 
        network, 
        address: formattedAddress,
        originalAddress: token.address,
        symbol: token.symbol 
      });

      // For ETH, use a specific URL
      if (formattedAddress === 'eth') {
        return `https://www.geckoterminal.com/eth/pools/0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2?embed=1&info=0&swaps=0&theme=dark&trades=0`;
      }

      // For Solana tokens
      if (network === 'solana') {
        if (token.address === NATIVE_SOL_ADDRESS || token.symbol.toUpperCase() === 'SOL') {
          return `https://www.geckoterminal.com/solana/pools/${WRAPPED_SOL_ADDRESS}?embed=1&info=0&swaps=0&theme=dark&trades=0`;
        }
      }

      // Special handling for Arbitrum
      if (network === 'arbitrum') {
        try {
          // First try to get pools for the token
          const poolsResponse = await axios.get(
            `https://api.geckoterminal.com/api/v2/networks/arbitrum/tokens/${formattedAddress}/pools`,
            {
              params: {
                page: 1,
                limit: 100,
                order: 'h24_volume_usd_desc'
              },
              headers: {
                'Accept': 'application/json'
              }
            }
          );

          if (poolsResponse.data?.data?.[0]) {
            const pool = poolsResponse.data.data[0];
            const poolAddress = pool.attributes?.address;
            if (poolAddress) {
              console.log('Found Arbitrum pool:', {
                poolAddress,
                poolId: pool.id,
                name: pool.attributes?.name
              });
              return `https://www.geckoterminal.com/arbitrum/pools/${poolAddress}?embed=1&info=0&swaps=0&theme=dark&trades=0`;
            }
          }
        } catch (err) {
          console.warn('Arbitrum pools lookup failed:', err);
        }
      }

      // For all other networks
      try {
        const poolsResponse = await axios.get(
          `https://api.geckoterminal.com/api/v2/networks/${network}/tokens/${formattedAddress}/pools`,
          {
            params: {
              page: 1,
              limit: 100,
              order: 'h24_volume_usd_desc',
              include: 'base_token,quote_token'
            },
            headers: {
              'Accept': 'application/json'
            }
          }
        );

        if (poolsResponse.data?.data?.[0]) {
          const pool = poolsResponse.data.data[0];
          const poolAddress = pool.attributes?.address;
          
          if (poolAddress) {
            console.log('Found pool:', {
              network,
              poolAddress,
              poolId: pool.id,
              name: pool.attributes?.name
            });
            
            return `https://www.geckoterminal.com/${network}/pools/${poolAddress}?embed=1&info=0&swaps=0&theme=dark&trades=0`;
          }
        }
      } catch (err) {
        console.warn('Pools lookup failed:', err);
      }

      // If direct pool lookup fails, try getting token info
      try {
        const tokenResponse = await axios.get(
          `https://api.geckoterminal.com/api/v2/networks/${network}/tokens/${formattedAddress}`,
          {
            headers: {
              'Accept': 'application/json'
            }
          }
        );

        if (tokenResponse.data?.data?.relationships?.top_pools?.data?.[0]) {
          const pool = tokenResponse.data.data.relationships.top_pools.data[0];
          const poolAddress = pool.attributes?.address || pool.id.split('_')[1];
          
          if (poolAddress) {
            console.log('Found pool from token info:', {
              network,
              poolAddress,
              poolId: pool.id
            });
            
            return `https://www.geckoterminal.com/${network}/pools/${poolAddress}?embed=1&info=0&swaps=0&theme=dark&trades=0`;
          }
        }
      } catch (err) {
        console.warn('Token info lookup failed:', err);
      }

      throw new Error('No trading pools found for this token');
    } catch (err) {
      console.error('Error fetching GeckoTerminal data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load chart');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const calculateRSI = (prices: number[], period = 14) => {
    try {
      console.log('Calculating RSI with prices:', prices);
      
      if (prices.length < period + 1) {
        console.log('Not enough price data for RSI calculation. Need:', period + 1, 'Have:', prices.length);
        return null;
      }

      // Calculate price changes
      const changes = prices.slice(1).map((price, i) => price - prices[i]);
      console.log('Price changes:', changes);
      
      // Separate gains and losses
      const gains = changes.map(change => change > 0 ? change : 0);
      const losses = changes.map(change => change < 0 ? Math.abs(change) : 0);
      console.log('Gains:', gains);
      console.log('Losses:', losses);

      // Calculate initial average gain and loss
      let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
      let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

      // Calculate subsequent values using the smoothing formula
      for (let i = period; i < changes.length; i++) {
        avgGain = ((avgGain * (period - 1)) + gains[i]) / period;
        avgLoss = ((avgLoss * (period - 1)) + losses[i]) / period;
      }

      // Add a small epsilon to prevent division by zero and ensure minimal values
      const epsilon = 0.00001;
      avgGain = Math.max(avgGain, epsilon);
      avgLoss = Math.max(avgLoss, epsilon);

      // Calculate RS and RSI
      const rs = avgGain / avgLoss;
      const rsi = Math.round(100 - (100 / (1 + rs)));

      return {
        value: rsi,
        interpretation: rsi > 70 ? 'Overbought' : rsi < 30 ? 'Oversold' : 'Neutral',
        details: {
          averageGain: avgGain.toFixed(6),
          averageLoss: avgLoss.toFixed(6),
          relativeStrength: rs.toFixed(4)
        }
      };
    } catch (error) {
      console.error('Error calculating RSI:', error);
      return null;
    }
  };

  // Generate more meaningful price points for RSI calculation
  const generatePricePoints = (poolDetails: any) => {
    const prices: number[] = [];
    const currentPrice = Number(poolDetails.base_token_price_usd);
    
    // Get the percentage changes
    const changes = {
      h24: Number(poolDetails.price_change_percentage?.h24 || 0) / 100,
      h6: Number(poolDetails.price_change_percentage?.h6 || 0) / 100,
      h1: Number(poolDetails.price_change_percentage?.h1 || 0) / 100,
      m30: Number(poolDetails.price_change_percentage?.m30 || 0) / 100,
      m15: Number(poolDetails.price_change_percentage?.m15 || 0) / 100,
      m5: Number(poolDetails.price_change_percentage?.m5 || 0) / 100
    };

    // Calculate historical prices based on percentage changes
    const price24h = currentPrice / (1 + changes.h24);
    const price6h = currentPrice / (1 + changes.h6);
    const price1h = currentPrice / (1 + changes.h1);
    const price30m = currentPrice / (1 + changes.m30);
    const price15m = currentPrice / (1 + changes.m15);
    const price5m = currentPrice / (1 + changes.m5);

    // Create an array of 14+ price points (for RSI calculation)
    prices.push(
      price24h,
      ...interpolatePrices(price24h, price6h, 3),
      price6h,
      ...interpolatePrices(price6h, price1h, 3),
      price1h,
      ...interpolatePrices(price1h, price30m, 2),
      price30m,
      price15m,
      price5m,
      currentPrice
    );

    return prices;
  };

  // Helper function to interpolate prices between two points
  const interpolatePrices = (startPrice: number, endPrice: number, points: number): number[] => {
    const prices: number[] = [];
    const step = (endPrice - startPrice) / (points + 1);
    for (let i = 1; i <= points; i++) {
      prices.push(startPrice + (step * i));
    }
    return prices;
  };

  const fetchTokenAnalysis = async (token: Token, network: string) => {
    try {
      setAnalysis(prev => ({ ...prev, loading: true, error: null }));
      
      // Check cache first
      const cachedAnalysis = getCachedAnalysis(token.address, network);
      if (cachedAnalysis) {
        console.log('Using cached analysis for', token.symbol);
        setAnalysis({
          analysis: cachedAnalysis,
          loading: false,
          error: null
        });
        return;
      }

      // If token is ETH, use WETH address but keep ETH display properties
      let formattedAddress;
      let displaySymbol = token.symbol;
      let displayName = token.name;
      
      if (token.address.toLowerCase() === ETH_ADDRESS.toLowerCase()) {
        formattedAddress = WETH_ADDRESS;
        // Keep ETH display properties
        displaySymbol = 'ETH';
        displayName = 'Ethereum';
      } else {
        formattedAddress = formatTokenAddress(token.address, network);
      }

      // Get pool data with increased limit for better liquidity calculation
      const poolsResponse = await axios.get(
        `https://api.geckoterminal.com/api/v2/networks/${network}/tokens/${formattedAddress}/pools`,
        {
          params: {
            page: 1,
            limit: 100,
            sort: 'h24_volume_usd_liquidity_desc'
          },
          headers: {
            'Accept': 'application/json;version=20230302'
          }
        }
      );

      if (!poolsResponse.data?.data?.[0]) {
        throw new Error(`No trading pools found for ${token.symbol}`);
      }

      // Calculate total liquidity across all pools
      const allPools: GeckoTerminalPool[] = poolsResponse.data.data;
      let totalLiquidity = 0;
      const topPool = allPools[0];
      
      allPools.forEach((pool: GeckoTerminalPool) => {
        const poolLiquidity = Number(pool.attributes?.reserve_in_usd || 0);
        totalLiquidity += poolLiquidity;
      });

      // Get detailed info from the most liquid pool for other metrics
      const poolDetailsResponse = await axios.get(
        `https://api.geckoterminal.com/api/v2/networks/${network}/pools/${topPool.id.split('_')[1]}`,
        {
          headers: {
            'Accept': 'application/json;version=20230302'
          }
        }
      );

      const poolDetails = poolDetailsResponse.data?.data?.attributes;
      console.log('Pool Details:', poolDetails);
      console.log('Total Aggregated Liquidity:', totalLiquidity);

      // Get current price at the top level
      const currentPrice = Number(poolDetails.base_token_price_usd);

      // Generate price points using the new function
      const prices = generatePricePoints(poolDetails);
      console.log('Generated price points:', prices);

      // Calculate RSI with the new price points
      const rsiData = calculateRSI(prices);
      console.log('Calculated RSI:', rsiData);

      // Prepare market data with explicit RSI information
      const marketData = {
        price: {
          current: formatPrice(currentPrice),
          change24h: Number(poolDetails.price_change_percentage?.h24 || 0).toFixed(2) + '%',
          usd: `$${formatPrice(currentPrice)}`,
          eth: poolDetails.base_token_price_native_currency,
          changes: {
            '1h': `${Number(poolDetails.price_change_percentage?.h1 || 0).toFixed(2)}%`,
            '6h': `${Number(poolDetails.price_change_percentage?.h6 || 0).toFixed(2)}%`,
            '24h': `${Number(poolDetails.price_change_percentage?.h24 || 0).toFixed(2)}%`
          }
        },
        volume: {
          current24h: `$${Number(poolDetails.volume_usd?.h24 || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}`,
          change24h: (() => {
            const volume24h = Number(poolDetails.volume_usd?.h24 || 0);
            const volume6h = Number(poolDetails.volume_usd?.h6 || 0);
            const normalized6hVolume = volume6h * 4;
            if (normalized6hVolume === 0) return '0.00%';
            const percentageChange = ((volume24h - normalized6hVolume) / normalized6hVolume * 100);
            return `${percentageChange.toFixed(2)}%`;
          })(),
          breakdown: {
            last1h: `$${Number(poolDetails.volume_usd?.h1 || 0).toLocaleString('en-US')}`,
            last6h: `$${Number(poolDetails.volume_usd?.h6 || 0).toLocaleString('en-US')}`,
            last24h: `$${Number(poolDetails.volume_usd?.h24 || 0).toLocaleString('en-US')}`
          }
        },
        liquidity: {
          total: `$${totalLiquidity.toLocaleString('en-US')}`,
          marketCap: `$${Number(poolDetails.market_cap_usd).toLocaleString('en-US')}`,
          fdv: `$${Number(poolDetails.fdv_usd).toLocaleString('en-US')}`,
          topPools: allPools.slice(0, 5).map((pool: GeckoTerminalPool) => ({
            name: pool.attributes?.name || 'Unknown Pool',
            liquidity: `$${Number(pool.attributes?.reserve_in_usd || 0).toLocaleString('en-US')}`,
            dex: pool.attributes?.dex_id || 'Unknown DEX'
          }))
        },
        transactions: {
          last24h: {
            total: (poolDetails.transactions?.h24?.buys || 0) + (poolDetails.transactions?.h24?.sells || 0),
            buys: poolDetails.transactions?.h24?.buys || 0,
            sells: poolDetails.transactions?.h24?.sells || 0,
            uniqueBuyers: poolDetails.transactions?.h24?.buyers || 0,
            uniqueSellers: poolDetails.transactions?.h24?.sellers || 0
          },
          buyRatio: ((poolDetails.transactions?.h24?.buys || 0) / 
            ((poolDetails.transactions?.h24?.buys || 0) + (poolDetails.transactions?.h24?.sells || 0) || 1) * 100).toFixed(2) + '%'
        },
        technical: {
          rsi: rsiData ? {
            value: rsiData.value,
            interpretation: rsiData.interpretation,
            details: {
              averageGain: rsiData.details.averageGain,
              averageLoss: rsiData.details.averageLoss,
              relativeStrength: rsiData.details.relativeStrength
            },
            period: '14 periods',
            dataPoints: prices.length
          } : null,
          priceChanges: {
            '1h': `${Number(poolDetails.price_change_percentage?.h1 || 0).toFixed(2)}%`,
            '6h': `${Number(poolDetails.price_change_percentage?.h6 || 0).toFixed(2)}%`,
            '24h': `${Number(poolDetails.price_change_percentage?.h24 || 0).toFixed(2)}%`
          }
        },
        pool: {
          name: poolDetails.name,
          dex: poolDetails.dex_id || 'Unknown',
          created: poolDetails.pool_created_at,
          type: poolDetails.type || 'Standard'
        }
      };

      // Update the token network reference
      const tokenData = {
        name: displayName,
        symbol: displaySymbol,
        address: formattedAddress,
        network
      };

      // When fetching from API, use streaming response
      const response = await fetch('/api/technical-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: tokenData,
          marketData
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analysis');
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let analysisText = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          analysisText += chunk;
          
          // Update the analysis state with each chunk
          setAnalysis(prev => ({
            ...prev,
            analysis: analysisText,
            loading: false,
            error: null
          }));
        }

        // Cache the complete analysis
        setCachedAnalysis(token.address, network, analysisText);
      }

    } catch (err) {
      console.error('Error fetching analysis:', err);
      let errorMessage = 'Failed to generate analysis. Please try again later.';
      
      if (axios.isAxiosError(err)) {
        const responseData = err.response?.data;
        console.log('API Error Response:', responseData);
        
        if (err.response?.status === 404) {
          errorMessage = `Could not find trading data for ${token.symbol}. The token might not have enough liquidity.`;
        } else if (err.response?.status === 400) {
          const errorDetail = responseData?.errors?.[0]?.detail;
          errorMessage = errorDetail || `Error fetching data for ${token.symbol}. Please try again.`;
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      setAnalysis(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
    }
  };

  useEffect(() => {
    const updateChart = async () => {
      // Clear chart and error when no token is selected or when chains don't match
      if (!selectedToken) {
        setChartUrl('');
        setError(null);
        return;
      }

      const network = getNetworkIdentifier(chainId);
      
      // Validate that the token belongs to the current chain
      const isEthereumToken = selectedToken.address.startsWith('0x');
      const isSolanaToken = !isEthereumToken;
      
      // Clear chart if token doesn't match current chain
      if ((network === 'solana' && isEthereumToken) || 
          (network !== 'solana' && isSolanaToken)) {
        setChartUrl('');
        setError(null);
        return;
      }

      console.log('Updating chart with:', { 
        token: selectedToken, 
        network, 
        chainId 
      });
      
      try {
        // For Solana tokens, ensure we're using the correct address format
        if (network === 'solana') {
          // Create a copy of the token with properly formatted address
          const formattedToken = {
            ...selectedToken,
            address: selectedToken.address.replace('spl-', '') // Remove any 'spl-' prefix
          };
          
          // Handle special case for native SOL
          if (formattedToken.address === NATIVE_SOL_ADDRESS) {
            formattedToken.address = WRAPPED_SOL_ADDRESS;
          }
          
          const url = await fetchGeckoTerminalUrl(formattedToken, network);
          if (url) {
            console.log('Setting Solana chart URL:', url);
            setChartUrl(url);
            setError(null);
          }
        } else {
          // Handle Ethereum and other chains as before
          const url = await fetchGeckoTerminalUrl(selectedToken, network);
          if (url) {
            console.log('Setting EVM chart URL:', url);
            setChartUrl(url);
            setError(null);
          }
        }
      } catch (err) {
        console.error('Error updating chart:', err);
        setError('No trading pools found for this token');
        setChartUrl('');
      }
    };

    updateChart();
  }, [selectedToken, chainId]);

  // Add a new effect to clear chart when activeChain changes
  useEffect(() => {
    setChartUrl('');
    setError(null);
    setShowAnalysisModal(false);
    setIsBlurred(false);
    setAnalysis({
      analysis: '',
      loading: false,
      error: null
    });
  }, [activeChain]);

  useImperativeHandle(ref, () => ({
    refreshChart: () => {
      if (iframeRef.current) {
        iframeRef.current.src = iframeRef.current.src;
      }
    }
  }));

  const handleAITabClick = () => {
    setShowAnalysisModal(true);
    setIsBlurred(true);
    if (selectedToken) {
      fetchTokenAnalysis(selectedToken, getNetworkIdentifier(chainId));
    }
  };

  const handleCloseAnalysis = () => {
    setShowAnalysisModal(false);
    setIsBlurred(false);
  };

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center text-white">
        Loading chart...
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center text-red-500">
        {error}
      </div>
    );
  }

  if (!selectedToken) {
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-500">
        Select a token to view its chart
      </div>
    );
  }

  return (
    <>
      {/* Global blur overlay when analysis is open */}
      {showAnalysisModal && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 cursor-pointer"
          onClick={handleCloseAnalysis}
        />
      )}
      <div ref={chartContainerRef} className="w-full h-full flex flex-col">
        {/* Tab Navigation */}
        <div className={`flex items-stretch gap-2 px-4 bg-gray-900 border-b border-gray-800 relative ${
          showAnalysisModal ? 'z-50' : ''
        }`}>
          <button
            onClick={() => {
              setShowAnalysisModal(false);
              setIsBlurred(false);
            }}
            className={`px-4 py-3 rounded-t-lg transition-colors duration-200 relative flex items-center ${
              !showAnalysisModal 
                ? 'bg-gray-800 text-white after:absolute after:bottom-[-2px] after:left-0 after:right-0 after:h-[2px] after:bg-gray-800'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Price Chart
          </button>
          <button
            onClick={handleAITabClick}
            className={`px-4 py-3 rounded-t-lg transition-colors duration-200 relative flex items-center ${
              showAnalysisModal 
                ? 'bg-gray-800 text-white after:absolute after:bottom-[-2px] after:left-0 after:right-0 after:h-[2px] after:bg-gray-800'
                : `ai-tab-button ${activeChain}-chain`
            }`}
          >
            <span className="ai-tab-text">AI Technical Analysis</span>
          </button>
          {showAnalysisModal && (
            <button
              onClick={handleCloseAnalysis}
              className="ml-auto mr-2 text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          )}
        </div>

        {/* Content Area */}
        <div className={`flex-1 relative ${showAnalysisModal ? 'z-50' : ''}`}>
          {/* Chart iframe with blur effect */}
          <div 
            className={`w-full h-full transition-all duration-300 ${
              showAnalysisModal ? 'blur-sm mt-[-1px]' : ''
            }`}
          >
            {chartUrl ? (
              <iframe
                ref={iframeRef}
                src={chartUrl}
                className="w-full h-full"
                title="GeckoTerminal Chart"
                frameBorder="0"
                allow="clipboard-write"
                allowFullScreen
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500">
                {selectedToken ? 'No chart data available' : 'Select a token to view its chart'}
              </div>
            )}
          </div>

          {/* Analysis Content */}
          {showAnalysisModal && (
            <div 
              className="absolute inset-0 bg-gray-900/95 backdrop-blur-sm shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative w-full h-full flex flex-col p-6">
                {/* Token Logo */}
                {selectedToken?.logoURI && (
                  <div className="flex justify-center mb-4">
                    <TokenImage 
                      src={selectedToken.logoURI} 
                      alt={selectedToken.symbol} 
                      width={64}
                      height={64}
                      className="rounded-full"
                    />
                  </div>
                )}
                <div className="flex-1 overflow-auto custom-scrollbar">
                  {analysis.loading ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                    </div>
                  ) : analysis.error ? (
                    <div className="text-red-500 p-4">{analysis.error}</div>
                  ) : (
                    <div className="prose prose-invert" style={{ maxWidth: '85ch' }}>
                      <StreamingText 
                        text={analysis.analysis} 
                        activeChain={activeChain}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Keep the existing styles */}
        <style jsx global>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }

          .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(31, 41, 55, 0.5);
            border-radius: 4px;
          }

          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(75, 85, 99, 0.8);
            border-radius: 4px;
          }

          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(107, 114, 128, 0.8);
          }

          /* For Firefox */
          .custom-scrollbar {
            scrollbar-width: thin;
            scrollbar-color: rgba(75, 85, 99, 0.8) rgba(31, 41, 55, 0.5);
          }

          .ai-tab-text {
            position: relative;
            color: #9ca3af;
            transition: color 0.3s ease;
          }

          /* Update the animation for Ethereum */
          .ethereum-chain:not(.bg-gray-800) .ai-tab-text {
            animation: ethereumPulse 3s ease-in-out infinite;
          }

          /* Update the animation for Solana */
          .solana-chain:not(.bg-gray-800) .ai-tab-text {
            animation: solanaPulse 3s ease-in-out infinite;
          }

          @keyframes ethereumPulse {
            0% {
              color: #9ca3af;
            }
            50% {
              color: #77be44;
            }
            100% {
              color: #9ca3af;
            }
          }

          @keyframes solanaPulse {
            0% {
              color: #9ca3af;
            }
            50% {
              color: #9333ea;
            }
            100% {
              color: #9ca3af;
            }
          }

          /* Simple white color on hover */
          .ai-tab-button:hover .ai-tab-text {
            color: white;
          }

          /* Active state */
          .bg-gray-800 .ai-tab-text {
            color: white;
            animation: none;
          }
        `}</style>
      </div>
    </>
  );
});

TokenChart.displayName = 'TokenChart';

export default TokenChart;

