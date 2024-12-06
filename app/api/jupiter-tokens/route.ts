import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// Add caching to reduce API calls
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 300000; // 5 minutes

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 100); // Cap at 100 items per page
    const search = searchParams.get('search')?.toLowerCase();

    // Check cache first
    const cacheKey = `tokens-${page}-${limit}-${search || ''}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return NextResponse.json(cached.data);
    }

    const response = await axios.get('https://quote-api.jup.ag/v6/tokens');
    
    if (!response.data) {
      throw new Error('No data received from Jupiter API');
    }

    let transformedTokens = Object.values(response.data).map((token: any) => ({
      address: token.address || token.mint,
      symbol: token.symbol,
      name: token.name,
      decimals: token.decimals,
      logoURI: token.logoURI || '',
      tags: token.tags || [],
      chainId: 'solana'
    }));

    // Apply search filter if provided
    if (search) {
      transformedTokens = transformedTokens.filter(token => 
        token.symbol.toLowerCase().includes(search) || 
        token.name.toLowerCase().includes(search) ||
        token.address.toLowerCase().includes(search)
      );
    }

    // Calculate pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedTokens = transformedTokens.slice(startIndex, endIndex);

    const result = {
      tokens: paginatedTokens,
      pagination: {
        total: transformedTokens.length,
        page,
        limit,
        totalPages: Math.ceil(transformedTokens.length / limit)
      }
    };

    // Cache the result
    cache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching Jupiter tokens:', error);
    return NextResponse.json({ error: 'Failed to fetch tokens' }, { status: 500 });
  }
} 