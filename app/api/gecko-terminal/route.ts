import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const network = searchParams.get('network');
    const tokenAddress = searchParams.get('token_address');

    if (!network || !tokenAddress) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const response = await axios.get(`https://api.geckoterminal.com/api/v2/networks/${network}/pools`, {
      params: {
        token_address: tokenAddress
      },
      headers: {
        'Accept': 'application/json'
      }
    });

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error fetching GeckoTerminal data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data from GeckoTerminal' },
      { status: 500 }
    );
  }
} 