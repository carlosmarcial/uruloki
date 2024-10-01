import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const tokenAddress = request.nextUrl.searchParams.get('tokenAddress');
  const amount = request.nextUrl.searchParams.get('amount');

  if (!tokenAddress || !amount) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  try {
    // This is a placeholder. In a real-world scenario, you would call your
    // price impact calculation service or smart contract here.
    const priceImpact = Math.random() * 2 - 1; // Random value between -1% and 1%

    return NextResponse.json({ priceImpact });
  } catch (error) {
    console.error('Error calculating price impact:', error);
    return NextResponse.json({ error: 'Error calculating price impact' }, { status: 500 });
  }
}