import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get('address');
  if (!address) {
    return NextResponse.json({ error: 'Address is required' }, { status: 400 });
  }

  const url = `https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=${address}&vs_currencies=usd`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    return NextResponse.json(data[address.toLowerCase()]);
  } catch (error) {
    console.error('Error fetching token price:', error);
    return NextResponse.json({ error: 'Error fetching token price' }, { status: 500 });
  }
}