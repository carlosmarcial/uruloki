import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch('https://tokens.coingecko.com/uniswap/all.json');
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch token list' }, { status: 500 });
  }
}