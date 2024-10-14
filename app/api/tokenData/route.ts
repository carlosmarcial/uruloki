import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch('https://tokens.coingecko.com/uniswap/all.json');
    const data = await response.json();

    // Filter for Ethereum tokens (chainId 1)
    const ethereumTokens = data.tokens.filter((token: any) => token.chainId === 1);

    return NextResponse.json(ethereumTokens);
  } catch (error) {
    console.error('Error fetching token data:', error);
    return NextResponse.json({ error: 'Failed to fetch token data' }, { status: 500 });
  }
}