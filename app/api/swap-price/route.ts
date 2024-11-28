import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { retry } from '@/app/utils/retry';

export async function GET(request: NextRequest) {
  try {
    const params = new URLSearchParams(request.nextUrl.search);
    const chainId = Number(params.get('chainId'));
    const sellToken = params.get('sellToken');
    const buyToken = params.get('buyToken');
    const sellAmount = params.get('sellAmount');
    const taker = params.get('taker');
    const slippageBps = params.get('slippageBps');

    console.log('Received parameters:', {
      chainId,
      sellToken,
      buyToken,
      sellAmount,
      taker,
      slippageBps
    });

    if (!chainId || !sellToken || !buyToken || !sellAmount || !taker) {
      console.error('Missing parameters:', {
        chainId,
        sellToken,
        buyToken,
        sellAmount,
        taker
      });
      throw new Error('Missing required parameters');
    }

    const apiBaseUrl = 'https://api.0x.org';

    const formattedSellToken = sellToken === 'ETH' ? 'WETH' : sellToken;
    const formattedBuyToken = buyToken === 'ETH' ? 'WETH' : buyToken;

    const apiParams = {
      sellToken: formattedSellToken,
      buyToken: formattedBuyToken,
      sellAmount,
      taker,
      chainId,
      slippageBps: Number(slippageBps),
      intentOnFilling: true
    };

    console.log('Requesting quote with params:', apiParams);

    try {
      const response = await retry(
        () => axios.get(`${apiBaseUrl}/swap/v2/quote`, {
          params: apiParams,
          headers: {
            '0x-api-key': process.env.ZEROX_API_KEY,
            '0x-version': 'v2'
          }
        }),
        {
          retries: 3,
          minTimeout: 1000,
          maxTimeout: 5000
        }
      );

      console.log('Quote received:', {
        buyAmount: response.data.buyAmount,
        price: response.data.price,
        sources: response.data.sources,
        gas: response.data.gas
      });

      return NextResponse.json(response.data);
    } catch (apiError: any) {
      console.error('0x API Error Response:', {
        status: apiError.response?.status,
        data: apiError.response?.data,
        validationErrors: apiError.response?.data?.validationErrors,
        details: apiError.response?.data?.details,
        requestId: apiError.response?.data?.request_id,
        url: apiError.config?.url,
        params: apiError.config?.params
      });

      throw apiError;
    }
  } catch (error: any) {
    console.error('API Error:', {
      message: error.message,
      response: error.response?.data,
      validationErrors: error.response?.data?.validationErrors,
      params: request.nextUrl.searchParams.toString()
    });

    return NextResponse.json(
      { 
        error: 'Failed to fetch swap quote',
        details: error.response?.data || error.message,
        originalError: error.response?.data,
        validationErrors: error.response?.data?.validationErrors
      }, 
      { status: error.response?.status || 500 }
    );
  }
}
