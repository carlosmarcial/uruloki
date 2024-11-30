import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { retry } from '@/app/utils/retry';

// Fee recipient constants
const FEE_RECIPIENT = '0x765d4129bbe4C9b134f307E2B10c6CF75Fe0e2f6';
const AFFILIATE_FEE = '0.01'; // 1%

export async function GET(request: NextRequest) {
  try {
    const params = new URLSearchParams(request.nextUrl.search);
    const chainId = Number(params.get('chainId'));
    const sellToken = params.get('sellToken');
    const buyToken = params.get('buyToken');
    const sellAmount = params.get('sellAmount');
    const taker = params.get('taker') || params.get('takerAddress');
    const slippageBps = params.get('slippageBps') || params.get('slippagePercentage');

    console.log('Received parameters:', {
      chainId,
      sellToken,
      buyToken,
      sellAmount,
      taker,
      slippageBps
    });

    if (!chainId || !sellToken || !buyToken || !sellAmount) {
      throw new Error('Missing required parameters');
    }

    const isEthTrade = sellToken.toLowerCase() === 'eth' || buyToken.toLowerCase() === 'eth';
    const endpoint = isEthTrade ? 
      'https://api.0x.org/swap/v1/price' : 
      'https://api.0x.org/swap/permit2/price';

    try {
      const response = await retry(
        () => axios.get(endpoint, {
          params: {
            sellToken: sellToken,
            buyToken: buyToken,
            sellAmount,
            chainId,
            ...(isEthTrade ? {
              takerAddress: taker,
              slippagePercentage: Number(slippageBps) / 10000
            } : {
              taker,
              slippageBps: Number(slippageBps)
            }),
            feeRecipient: FEE_RECIPIENT,
            buyTokenPercentageFee: AFFILIATE_FEE
          },
          headers: {
            '0x-api-key': process.env.ZEROX_API_KEY
          }
        }),
        {
          retries: 3,
          minTimeout: 1000,
          maxTimeout: 5000
        }
      );

      if (sellToken.toLowerCase() === 'eth') {
        response.data.value = sellAmount;
      }

      return NextResponse.json(response.data);
    } catch (apiError: any) {
      console.error('0x API Error:', {
        status: apiError.response?.status,
        data: apiError.response?.data,
        message: apiError.message,
        url: apiError.config?.url,
        params: apiError.config?.params
      });

      throw apiError;
    }
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch swap quote',
        details: error.message || 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}
