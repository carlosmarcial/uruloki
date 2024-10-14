import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const endpoint = searchParams.get('endpoint');
  const params = Object.fromEntries(searchParams.entries());
  delete params.endpoint;

  try {
    const response = await axios.get(`https://api.coingecko.com/api/v3/${endpoint}`, { params });
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error fetching data from CoinGecko:', error);
    return NextResponse.json({ error: 'Error fetching data from CoinGecko' }, { status: 500 });
  }
}