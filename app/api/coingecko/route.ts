import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// Add caching
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 60000; // 1 minute

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint');
    const contract_addresses = searchParams.get('contract_addresses');
    const vs_currencies = searchParams.get('vs_currencies');
    const ids = searchParams.get('ids');

    const cacheKey = `${endpoint}-${contract_addresses || ids}-${vs_currencies}`;
    const cached = cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return NextResponse.json(cached.data);
    }

    let url = `https://api.coingecko.com/api/v3/${endpoint}`;
    let params: any = {};

    if (endpoint === 'simple/price') {
      params = {
        ids,
        vs_currencies
      };
    } else {
      params = {
        contract_addresses,
        vs_currencies,
      };
    }

    const response = await axios.get(url, {
      params,
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache',
      }
    });

    // Cache the response
    cache.set(cacheKey, {
      data: response.data,
      timestamp: Date.now()
    });

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Error fetching data from CoinGecko:', error);
    
    // If rate limited, return cached data if available
    if (error.response?.status === 429) {
      const cacheKey = `${searchParams.get('endpoint')}-${searchParams.get('contract_addresses') || searchParams.get('ids')}-${searchParams.get('vs_currencies')}`;
      const cached = cache.get(cacheKey);
      if (cached) {
        return NextResponse.json(cached.data);
      }
    }

    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: error.response?.status || 500 }
    );
  }
}