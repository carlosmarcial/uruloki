import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const chainId = searchParams.get('chainId');
  const sellToken = searchParams.get('sellToken');
  const buyToken = searchParams.get('buyToken');
  const sellAmount = searchParams.get('sellAmount');
  const takerAddress = searchParams.get('takerAddress');

  if (!chainId || !sellToken || !buyToken || !sellAmount || !takerAddress) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  }

  try {
    console.log('Fetching swap quote with params:', { chainId, sellToken, buyToken, sellAmount, takerAddress });
    
    const response = await axios.get('https://api.0x.org/swap/v1/quote', {
      params: {
        chainId: parseInt(chainId),
        sellToken,
        buyToken,
        sellAmount,
        takerAddress,
      },
      headers: {
        '0x-api-key': process.env.NEXT_PUBLIC_ZEROEX_API_KEY,
      }
    });

    console.log('Swap quote response:', response.data);
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error fetching swap quote:', error);
    if (axios.isAxiosError(error) && error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
      return NextResponse.json({ error: 'Error fetching swap quote', details: error.response.data }, { status: error.response.status });
    }
    return NextResponse.json({ error: 'Error fetching swap quote' }, { status: 500 });
  }
}