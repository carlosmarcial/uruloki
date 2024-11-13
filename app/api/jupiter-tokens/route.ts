import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET() {
  try {
    const response = await axios.get('https://quote-api.jup.ag/v6/tokens');
    
    if (!response.data) {
      throw new Error('No data received from Jupiter API');
    }

    const transformedTokens = Object.values(response.data).map((token: any) => ({
      address: token.address || token.mint,
      symbol: token.symbol,
      name: token.name,
      decimals: token.decimals,
      logoURI: token.logoURI || '',
      tags: token.tags || [],
      chainId: 'solana'
    }));

    return NextResponse.json(transformedTokens);
  } catch (error) {
    console.error('Error fetching Jupiter tokens:', error);
    return NextResponse.json({ error: 'Failed to fetch tokens' }, { status: 500 });
  }
} 