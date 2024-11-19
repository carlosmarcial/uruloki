import React, { forwardRef, useImperativeHandle, useRef, useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

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
}

export interface TokenChartRef {
  refreshChart: () => void;
}

interface TokenAnalysis {
  analysis: string;
  loading: boolean;
  error: string | null;
}

const WRAPPED_SOL_ADDRESS = 'So11111111111111111111111111111111111111112';
const NATIVE_SOL_ADDRESS = '11111111111111111111111111111111';

const TokenChart = forwardRef<TokenChartRef, TokenChartProps>(({ selectedToken, chainId }, ref) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [chartUrl, setChartUrl] = useState<string>('');
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [analysis, setAnalysis] = useState<TokenAnalysis>({
    analysis: '',
    loading: false,
    error: null
  });

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
        return 'polygon';
      case 42161:
        return 'arbitrum';
      case 43114:
        return 'avalanche';
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

      const formattedAddress = formatTokenAddress(token.address, network);
      console.log('Fetching pool for:', { network, address: formattedAddress });

      // For ETH, use a specific URL
      if (formattedAddress === 'eth') {
        return `https://www.geckoterminal.com/eth/pools/0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2?embed=1&info=0&swaps=0&theme=dark&trades=0&stats=0`;
      }

      // For Solana tokens
      if (network === 'solana') {
        // Special handling for SOL token
        if (token.address === NATIVE_SOL_ADDRESS || token.symbol.toUpperCase() === 'SOL') {
          // Use a known liquid Wrapped SOL pool
          return `https://www.geckoterminal.com/solana/pools/${WRAPPED_SOL_ADDRESS}?embed=1&info=0&swaps=0&theme=dark&trades=0&stats=0`;
        }

        try {
          // First try to get token pools
          const tokenResponse = await axios.get(
            `https://api.geckoterminal.com/api/v2/networks/solana/tokens/${formattedAddress}`,
            {
              headers: {
                'Accept': 'application/json'
              }
            }
          );

          // If we have pools data, get the most liquid pool
          if (tokenResponse.data?.data?.relationships?.top_pools?.data?.[0]?.id) {
            const poolId = tokenResponse.data.data.relationships.top_pools.data[0].id;
            const [networkId, poolAddress] = poolId.split('_');
            return `https://www.geckoterminal.com/${network}/pools/${poolAddress}?embed=1&info=0&swaps=0&theme=dark&trades=0&stats=0`;
          }
        } catch (err) {
          console.warn('Token info fetch failed:', err);
        }

        // Fallback to searching pools
        try {
          const poolsResponse = await axios.get(
            `https://api.geckoterminal.com/api/v2/networks/${network}/tokens/${formattedAddress}/pools?page=1&limit=1`,
            {
              headers: {
                'Accept': 'application/json'
              }
            }
          );

          if (poolsResponse.data?.data?.[0]?.id) {
            const [networkId, poolAddress] = poolsResponse.data.data[0].id.split('_');
            return `https://www.geckoterminal.com/${network}/pools/${poolAddress}?embed=1&info=0&swaps=0&theme=dark&trades=0&stats=0`;
          }
        } catch (err) {
          console.warn('Pools search failed:', err);
          throw new Error('No trading pools found for this token');
        }
      }

      // For other networks, continue with existing logic
      try {
        const poolsResponse = await axios.get(
          `https://api.geckoterminal.com/api/v2/search/pools?query=${formattedAddress}&network=${network}`,
          {
            headers: {
              'Accept': 'application/json'
            }
          }
        );

        if (poolsResponse.data?.data?.[0]?.attributes?.address) {
          const poolAddress = poolsResponse.data.data[0].attributes.address;
          return `https://www.geckoterminal.com/${network}/pools/${poolAddress}?embed=1&info=0&swaps=0&theme=dark&trades=0&stats=0`;
        }
      } catch (err) {
        console.warn('Pool search failed:', err);
        throw new Error('No trading pools found for this token');
      }

      // If we get here, we couldn't find any pools
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
      if (prices.length < period + 1) {
        console.log('Not enough price data for RSI calculation');
        return null;
      }

      // Calculate price changes
      const changes = prices.slice(1).map((price, i) => price - prices[i]);
      
      // Separate gains and losses
      const gains = changes.map(change => change > 0 ? change : 0);
      const losses = changes.map(change => change < 0 ? Math.abs(change) : 0);

      // Calculate initial average gain and loss
      let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
      let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

      // Calculate subsequent values using the smoothing formula
      for (let i = period; i < changes.length; i++) {
        avgGain = ((avgGain * (period - 1)) + gains[i]) / period;
        avgLoss = ((avgLoss * (period - 1)) + losses[i]) / period;
      }

      // Calculate RS and RSI
      const rs = avgGain / (avgLoss || 1); // Avoid division by zero
      const rsi = Math.round(100 - (100 / (1 + rs)));

      // Enhanced logging for debugging
      console.log('RSI Calculation Details:', {
        avgGain,
        avgLoss,
        rs,
        rsi,
        pricesUsed: prices.length,
        firstPrice: prices[0],
        lastPrice: prices[prices.length - 1]
      });

      return {
        value: rsi,
        interpretation: rsi > 70 ? 'Overbought' : rsi < 30 ? 'Oversold' : 'Neutral',
        details: {
          averageGain: avgGain.toFixed(4),
          averageLoss: avgLoss.toFixed(4),
          relativeStrength: rs.toFixed(4)
        }
      };
    } catch (error) {
      console.error('Error calculating RSI:', error);
      return null;
    }
  };

  const fetchTokenAnalysis = async (token: Token, network: string) => {
    try {
      setAnalysis(prev => ({ ...prev, loading: true, error: null }));
      const formattedAddress = formatTokenAddress(token.address, network);

      // Get pool data
      const poolsResponse = await axios.get(
        `https://api.geckoterminal.com/api/v2/networks/${network}/tokens/${formattedAddress}/pools`,
        {
          params: {
            page: 1,
            limit: 1,
            sort: 'h24_volume_usd_desc'
          },
          headers: {
            'Accept': 'application/json;version=20230302'
          }
        }
      );

      if (!poolsResponse.data?.data?.[0]) {
        throw new Error(`No trading pools found for ${token.symbol}`);
      }

      const pool = poolsResponse.data.data[0];
      const poolId = pool.id;
      const [networkId, poolAddress] = poolId.split('_');

      // Get detailed pool information
      const poolDetailsResponse = await axios.get(
        `https://api.geckoterminal.com/api/v2/networks/${networkId}/pools/${poolAddress}`,
        {
          headers: {
            'Accept': 'application/json;version=20230302'
          }
        }
      );

      const poolDetails = poolDetailsResponse.data?.data?.attributes;
      console.log('Pool Details:', poolDetails);

      // Generate more price points for RSI calculation
      const intervals = ['m5', 'm15', 'm30', 'h1', 'h6', 'h24'];
      const currentPrice = Number(poolDetails.base_token_price_usd);
      
      // Generate price points with more variation
      const prices: number[] = [currentPrice];
      let lastPrice = currentPrice;
      
      intervals.forEach(interval => {
        const change = Number(poolDetails.price_change_percentage?.[interval] || 0) / 100;
        const previousPrice = lastPrice / (1 + change);
        
        // Add more intermediate points
        const step = (lastPrice - previousPrice) / 4;
        for (let i = 1; i <= 4; i++) {
          prices.push(lastPrice - (step * i));
        }
        
        lastPrice = previousPrice;
      });

      console.log('Price points for RSI calculation:', prices);

      // Calculate RSI
      const rsiData = calculateRSI(prices);
      console.log('Calculated RSI Data:', rsiData);

      // Prepare market data with explicit RSI information
      const marketData = {
        price: {
          current: currentPrice.toFixed(8),
          change24h: Number(poolDetails.price_change_percentage?.h24 || 0).toFixed(2) + '%',
          usd: `$${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 })}`,
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
            // Normalize 6h volume to 24h equivalent for fair comparison
            const normalized6hVolume = volume6h * 4; // multiply by 4 to get 24h equivalent
            
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
        liquidity: {
          total: `$${Number(poolDetails.reserve_in_usd).toLocaleString('en-US')}`,
          marketCap: `$${Number(poolDetails.market_cap_usd).toLocaleString('en-US')}`,
          fdv: `$${Number(poolDetails.fdv_usd).toLocaleString('en-US')}`
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

      console.log('Volume data:', {
        volume24h: poolDetails.volume_usd?.h24,
        volume6h: poolDetails.volume_usd?.h6,
        volume1h: poolDetails.volume_usd?.h1,
        calculatedChange: marketData.volume.change24h
      });

      console.log('Market data being sent to API:', JSON.stringify(marketData.technical, null, 2));

      // Fetch the analysis from our API
      const analysisResponse = await axios.post('/api/technical-analysis', {
        token: {
          name: token.name,
          symbol: token.symbol,
          address: formattedAddress,
          network: networkId
        },
        marketData
      });

      setAnalysis({
        analysis: analysisResponse.data.analysis,
        loading: false,
        error: null
      });

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
      if (selectedToken) {
        const network = getNetworkIdentifier(chainId);
        try {
          const url = await fetchGeckoTerminalUrl(selectedToken, network);
          if (url) {
            console.log('Setting chart URL:', url);
            setChartUrl(url);
          }
        } catch (err) {
          console.error('Error updating chart:', err);
          setError('Failed to load chart');
        }
      }
    };

    updateChart();
  }, [selectedToken, chainId]);

  useImperativeHandle(ref, () => ({
    refreshChart: () => {
      if (iframeRef.current) {
        iframeRef.current.src = iframeRef.current.src;
      }
    }
  }));

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
    <div className="w-full h-full relative">
      {/* AI Analysis Button */}
      <button
        onClick={() => {
          setShowAnalysisModal(true);
          if (selectedToken) {
            fetchTokenAnalysis(selectedToken, getNetworkIdentifier(chainId));
          }
        }}
        className="absolute top-4 right-4 z-10 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-lg transition-colors duration-200"
      >
        AI Technical Analysis
      </button>

      {/* Chart iframe */}
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
          No chart data available
        </div>
      )}

      {/* Analysis Modal */}
      <AnimatePresence>
        {showAnalysisModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black bg-opacity-90 z-20 p-6"
          >
            <div className="relative w-full h-full bg-gray-900 rounded-lg p-6 overflow-auto">
              <button
                onClick={() => setShowAnalysisModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white"
              >
                ✕
              </button>
              
              <h2 className="text-xl font-bold text-white mb-4">
                AI Technical Analysis for {selectedToken?.symbol}
              </h2>

              {analysis.loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                </div>
              ) : analysis.error ? (
                <div className="text-red-500">{analysis.error}</div>
              ) : (
                <div className="text-white whitespace-pre-wrap">{analysis.analysis}</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

TokenChart.displayName = 'TokenChart';

export default TokenChart;

