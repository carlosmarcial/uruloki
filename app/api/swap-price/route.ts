import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { retry } from '@/app/utils/retry';

// Constants
const FEE_RECIPIENT = '0x765d4129bbe4C9b134f307E2B10c6CF75Fe0e2f6';
const PERMIT2_ADDRESS = '0x000000000022D473030F116dDEE9F6B43aC78BA3';
const ETH_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const chainId = Number(searchParams.get('chainId'));
    const sellToken = searchParams.get('sellToken');
    const buyToken = searchParams.get('buyToken');
    const sellAmount = searchParams.get('sellAmount');
    const taker = searchParams.get('taker');
    const slippageBps = searchParams.get('slippageBps') || '50'; // Default to 0.5%

    console.log('Received parameters:', {
      chainId,
      sellToken,
      buyToken,
      sellAmount,
      taker,
      slippageBps
    });

    if (!chainId || !sellToken || !buyToken || !sellAmount || !taker) {
      throw new Error('Missing required parameters');
    }

    // Determine if we're dealing with a native ETH trade
    const isEthTrade = sellToken.toLowerCase() === 'eth' || buyToken.toLowerCase() === 'eth';
    
    // Convert ETH to the proper address format
    const formattedSellToken = sellToken.toLowerCase() === 'eth' ? ETH_ADDRESS : sellToken;
    const formattedBuyToken = buyToken.toLowerCase() === 'eth' ? ETH_ADDRESS : buyToken;

    const baseParams = {
      sellToken: formattedSellToken,
      buyToken: formattedBuyToken,
      sellAmount,
      chainId: Number(chainId),
      takerAddress: taker,
      slippagePercentage: Number(slippageBps) / 10000,
      skipValidation: false,
      intentOnFilling: true,
      enableSlippageProtection: true,
      integrator: 'uruloki-dex'
    };

    let endpoint;
    let requestParams;

    if (isEthTrade) {
      endpoint = 'https://api.0x.org/swap/v1/price';
      requestParams = {
        ...baseParams,
        integratorFee: '15',
        integratorFeeRecipient: FEE_RECIPIENT
      };
    } else {
      endpoint = 'https://api.0x.org/swap/permit2/price';
      requestParams = {
        ...baseParams,
        taker,
        slippageBps: Number(slippageBps),
        swapFeeRecipient: FEE_RECIPIENT,
        swapFeeBps: '15',
        swapFeeToken: formattedBuyToken
      };
    }

    console.log('Sending request to 0x API:', {
      endpoint,
      params: requestParams
    });

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        '0x-api-key': process.env.ZEROX_API_KEY || ''
      };

      if (!isEthTrade) {
        headers['0x-version'] = 'v2';
      }

      const response = await retry(
        () => axios.get(endpoint, {
          params: requestParams,
          headers
        }),
        {
          retries: 3,
          minTimeout: 1000,
          maxTimeout: 5000
        }
      );

      // Validate the response
      if (!response.data) {
        console.error('Invalid price response:', response.data);
        throw new Error('Invalid price response: missing data');
      }

      // Format the response
      const priceResponse = {
        ...response.data,
        value: sellToken.toLowerCase() === 'eth' ? sellAmount : '0',
        allowanceTarget: isEthTrade ? '0x0000000000000000000000000000000000000000' : PERMIT2_ADDRESS
      };

      console.log('Formatted price response:', priceResponse);
      return NextResponse.json(priceResponse);
    } catch (apiError: any) {
      console.error('0x API Error:', {
        status: apiError.response?.status,
        data: apiError.response?.data,
        message: apiError.message,
        url: apiError.config?.url,
        params: apiError.config?.params,
        headers: apiError.config?.headers
      });

      if (apiError.response?.data?.data?.details) {
        console.error('Validation Details:', apiError.response.data.data.details);
      }

      return NextResponse.json(
        { 
          error: 'Failed to fetch swap quote',
          details: apiError.response?.data || apiError.message,
          validationDetails: apiError.response?.data?.data?.details || []
        }, 
        { status: apiError.response?.status || 500 }
      );
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
