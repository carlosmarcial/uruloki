import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sellToken = searchParams.get('sellToken');
  const buyToken = searchParams.get('buyToken');
  const sellAmount = searchParams.get('sellAmount');
  const takerAddress = searchParams.get('takerAddress');

  console.log('Quote API called with params:', { sellToken, buyToken, sellAmount, takerAddress });

  if (!sellToken || !buyToken || !sellAmount || !takerAddress || parseFloat(sellAmount) === 0) {
    return NextResponse.json({ 
      error: 'Invalid or missing parameters',
      details: { sellToken, buyToken, sellAmount, takerAddress }
    }, { status: 400 });
  }

  try {
    const response = await axios.get(`https://api.0x.org/swap/v1/quote`, {
      params: {
        sellToken,
        buyToken,
        sellAmount,
        takerAddress,
        slippagePercentage: 0.01, // 1% slippage tolerance
      },
      headers: {
        '0x-api-key': process.env.NEXT_PUBLIC_ZEROEX_API_KEY,
      },
    });

    console.log('0x API quote response:', response.data);
    
    // Extract gas estimation from the response
    const gasEstimation = {
      gasPrice: response.data.gasPrice,
      estimatedGas: response.data.estimatedGas,
      estimatedGasPrice: response.data.estimatedGasPrice,
    };

    return NextResponse.json({
      ...response.data,
      gasEstimation
    });
  } catch (error) {
    console.error('Error fetching quote:', error);
    if (axios.isAxiosError(error) && error.response) {
      const errorData = error.response.data;
      if (errorData.code === 111 && errorData.reason === "Gas estimation failed") {
        return NextResponse.json({ 
          error: 'Gas estimation failed',
          details: 'The transaction might fail. Please check your balance and try again with a smaller amount.',
          originalError: errorData
        }, { status: 400 });
      }
      return NextResponse.json({ 
        error: 'Error from 0x API',
        details: errorData
      }, { status: error.response.status });
    }
    return NextResponse.json({ error: 'Failed to fetch quote' }, { status: 500 });
  }
}
