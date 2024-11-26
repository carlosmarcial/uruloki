import React, { forwardRef, useImperativeHandle, useRef, useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

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
  const chartContainerRef = useRef<HTMLDivElement>(null);
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

      const formattedAddress = formatTokenAddress(token.address, network);
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

      // Fetch the analysis from our API with streaming
      const response = await fetch('/api/technical-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: {
            name: token.name,
            symbol: token.symbol,
            address: formattedAddress,
            network: networkId
          },
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
      if (selectedToken) {
        const network = getNetworkIdentifier(chainId);
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
          setError('Failed to load chart');
          setChartUrl('');
        }
      } else {
        // Clear chart when no token is selected
        setChartUrl('');
        setError(null);
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
    <div ref={chartContainerRef} className="w-full h-full relative">
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
        {showAnalysisModal && chartContainerRef.current && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50"
            style={{
              width: chartContainerRef.current.offsetWidth,
              height: chartContainerRef.current.offsetHeight
            }}
          >
            {/* Backdrop with blur */}
            <div 
              className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
              onClick={() => setShowAnalysisModal(false)}
            />
            
            {/* Modal Content */}
            <div className="absolute inset-0 bg-gray-900/95 rounded-lg backdrop-blur-sm">
              <div className="relative w-full h-full flex flex-col p-6">
                {/* Header */}
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    {selectedToken?.logoURI && (
                      <img 
                        src={selectedToken.logoURI} 
                        alt={`${selectedToken.symbol} logo`}
                        className="w-8 h-8 rounded-full"
                      />
                    )}
                    <h2 className="text-xl font-bold text-white">
                      AI Technical Analysis for {selectedToken?.symbol}
                    </h2>
                  </div>
                  <button
                    onClick={() => setShowAnalysisModal(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>

                {/* Content Area with Custom Scrollbar */}
                <div className="flex-1 overflow-auto custom-scrollbar">
                  {analysis.loading ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                    </div>
                  ) : analysis.error ? (
                    <div className="text-red-500 p-4">{analysis.error}</div>
                  ) : (
                    <div className="text-white whitespace-pre-wrap p-4">
                      {analysis.analysis}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add custom scrollbar styles */}
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
      `}</style>
    </div>
  );
});

TokenChart.displayName = 'TokenChart';

export default TokenChart;

