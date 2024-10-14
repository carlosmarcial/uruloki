import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: NextRequest) {
  try {
    const { sellToken, buyToken, sellAmount } = await request.json();

    console.log('Price API called with params:', { sellToken, buyToken, sellAmount });

    if (!sellToken || !buyToken || !sellAmount || parseFloat(sellAmount) === 0) {
      return NextResponse.json({ 
        error: 'Invalid or missing parameters',
        details: { sellToken, buyToken, sellAmount }
      }, { status: 400 });
    }

    const response = await axios.get(`https://api.0x.org/swap/v1/price`, {
      params: {
        sellToken,
        buyToken,
        sellAmount,
      },
      headers: {
        '0x-api-key': process.env.NEXT_PUBLIC_ZEROEX_API_KEY,
      },
    });

    console.log('0x API price response:', response.data);
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error fetching price:', error);
    if (axios.isAxiosError(error) && error.response) {
      return NextResponse.json({ 
        error: 'Error from 0x API',
        details: error.response.data 
      }, { status: error.response.status });
    }
    return NextResponse.json({ error: 'Failed to fetch price' }, { status: 500 });
  }
}

// Keep the GET method for backwards compatibility or remove if not needed
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sellToken = searchParams.get('sellToken');
  const buyToken = searchParams.get('buyToken');
  const sellAmount = searchParams.get('sellAmount');

  console.log('Price API called with params:', { sellToken, buyToken, sellAmount });

  if (!sellToken || !buyToken || !sellAmount || parseFloat(sellAmount) === 0) {
    return NextResponse.json({ 
      error: 'Invalid or missing parameters',
      details: { sellToken, buyToken, sellAmount }
    }, { status: 400 });
  }

  try {
    const response = await axios.get(`https://api.0x.org/swap/v1/price`, {
      params: {
        sellToken,
        buyToken,
        sellAmount,
      },
      headers: {
        '0x-api-key': process.env.NEXT_PUBLIC_ZEROEX_API_KEY,
      },
    });

    console.log('0x API price response:', response.data);
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error fetching price:', error);
    if (axios.isAxiosError(error) && error.response) {
      return NextResponse.json({ 
        error: 'Error from 0x API',
        details: error.response.data 
      }, { status: error.response.status });
    }
    return NextResponse.json({ error: 'Failed to fetch price' }, { status: 500 });
  }
}
