import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// Updated network mapping according to GeckoTerminal API docs
const NETWORK_MAPPING = {
  1: 'eth', // Ethereum mainnet
  137: 'polygon_pos', // Polygon PoS - Updated to match GeckoTerminal's exact network identifier
  42161: 'arbitrum_one', // Arbitrum
  43114: 'avax', // Avalanche
  10: 'optimism', // Optimism
  'solana': 'solana' // Solana
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const network = searchParams.get('network');
    const tokenAddress = searchParams.get('token_address')?.toLowerCase();
    const chainId = searchParams.get('chainId');

    if (!tokenAddress) {
      return NextResponse.json({ error: 'Missing token address' }, { status: 400 });
    }

    // Get the correct network identifier
    const geckoNetwork = chainId ? NETWORK_MAPPING[chainId as keyof typeof NETWORK_MAPPING] : network;
    
    if (!geckoNetwork) {
      return NextResponse.json({ error: 'Unsupported network' }, { status: 400 });
    }

    console.log(`Fetching GeckoTerminal data for network: ${geckoNetwork}, token: ${tokenAddress}`);

    // First try to get all pools for the token
    try {
      const poolsResponse = await axios.get(
        `https://api.geckoterminal.com/api/v2/networks/${geckoNetwork}/dexes/all/pools`,
        {
          params: {
            token_addresses: tokenAddress,
            page: 1,
            limit: 100
          },
          headers: {
            'Accept': 'application/json'
          }
        }
      );

      if (poolsResponse.data?.data?.length > 0) {
        // Sort pools by volume to get the most active one
        const sortedPools = poolsResponse.data.data.sort((a: any, b: any) => 
          (b.attributes.volume_usd || 0) - (a.attributes.volume_usd || 0)
        );

        const topPool = sortedPools[0];
        
        // Get detailed pool info
        const poolDetailsResponse = await axios.get(
          `https://api.geckoterminal.com/api/v2/networks/${geckoNetwork}/pools/${topPool.id}`,
          {
            headers: {
              'Accept': 'application/json'
            }
          }
        );

        if (poolDetailsResponse.data?.data) {
          const poolData = poolDetailsResponse.data.data;
          return NextResponse.json({
            data: {
              id: poolData.id,
              type: 'pool',
              attributes: {
                price: poolData.attributes?.base_token_price_usd,
                price_24h_delta_in_percent: poolData.attributes?.price_change_24h,
                total_volume_24h: poolData.attributes?.volume_usd_24h,
                pool_address: poolData.attributes?.address,
                name: poolData.attributes?.name
              }
            }
          });
        }
      }
    } catch (error: unknown) {
      const err = error as Error;
      console.log('Pools lookup failed:', err.message);
    }

    // If pools lookup fails, try token info as fallback
    try {
      const tokenResponse = await axios.get(
        `https://api.geckoterminal.com/api/v2/networks/${geckoNetwork}/tokens/${tokenAddress}`,
        {
          headers: {
            'Accept': 'application/json'
          }
        }
      );
      
      if (tokenResponse.data?.data) {
        return NextResponse.json(tokenResponse.data);
      }
    } catch (error: unknown) {
      const err = error as Error;
      console.log('Token lookup failed:', err.message);
    }

    // If both attempts fail, return error
    return NextResponse.json({ error: 'No trading data found for token' }, { status: 404 });
  } catch (error: any) {
    console.error('Error fetching GeckoTerminal data:', error.response?.data || error);
    return NextResponse.json(
      { error: 'Failed to fetch data from GeckoTerminal' },
      { status: error.response?.status || 500 }
    );
  }
} 