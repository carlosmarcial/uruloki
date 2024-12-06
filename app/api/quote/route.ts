import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { PERMIT2_ADDRESS } from '@/app/constants';

// Constants
const FEE_RECIPIENT = '0x765d4129bbe4C9b134f307E2B10c6CF75Fe0e2f6';
const ETH_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const sellToken = searchParams.get('sellToken');
    const buyToken = searchParams.get('buyToken');
    const sellAmount = searchParams.get('sellAmount');
    const taker = searchParams.get('taker');
    const chainId = searchParams.get('chainId');
    const slippageBps = searchParams.get('slippageBps') || '50'; // Default to 0.5%

    console.log('Quote API called with params:', { 
      sellToken, 
      buyToken, 
      sellAmount, 
      taker,
      chainId,
      slippageBps
    });

    if (!sellToken || !buyToken || !sellAmount || !taker || !chainId) {
      return NextResponse.json({ 
        error: 'Invalid or missing parameters',
        details: { sellToken, buyToken, sellAmount, taker, chainId }
      }, { status: 400 });
    }

    try {
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

      if (isEthTrade) {
        // For ETH trades, use v1 quote endpoint
        const response = await axios.get('https://api.0x.org/swap/v1/quote', {
          params: {
            ...baseParams,
            integratorFee: '15',
            integratorFeeRecipient: FEE_RECIPIENT
          },
          headers: {
            'Content-Type': 'application/json',
            '0x-api-key': process.env.ZEROX_API_KEY
          }
        });

        console.log('Raw ETH quote response:', response.data);

        // Validate the response for ETH trades
        if (!response.data || !response.data.data || !response.data.to) {
          console.error('Invalid ETH quote response:', response.data);
          throw new Error('Invalid quote response: missing transaction data');
        }

        // Format the response for ETH trades
        const quoteResponse = {
          ...response.data,
          transaction: {
            from: taker,
            to: response.data.to,
            data: response.data.data,
            value: sellToken.toLowerCase() === 'eth' ? sellAmount : '0',
            gas: response.data.gas || response.data.estimatedGas,
            gasPrice: response.data.gasPrice,
            chainId: Number(chainId)
          },
          allowanceTarget: '0x0000000000000000000000000000000000000000'
        };

        console.log('Formatted ETH quote response:', quoteResponse);
        return NextResponse.json(quoteResponse);
      } else {
        // Use permit2 endpoint for ERC20-to-ERC20 trades
        const response = await axios.get('https://api.0x.org/swap/permit2/quote', {
          params: {
            ...baseParams,
            taker,
            slippageBps: Number(slippageBps),
            swapFeeRecipient: FEE_RECIPIENT,
            swapFeeBps: '15',
            swapFeeToken: formattedBuyToken
          },
          headers: {
            'Content-Type': 'application/json',
            '0x-api-key': process.env.ZEROX_API_KEY,
            '0x-version': 'v2'
          }
        });

        console.log('Raw ERC20 quote response:', response.data);

        // Validate the response for ERC20 trades
        if (!response.data || !response.data.transaction || !response.data.transaction.data) {
          console.error('Invalid ERC20 quote response:', response.data);
          throw new Error('Invalid quote response: missing transaction data');
        }

        // For ERC20-to-ERC20, the transaction object is already properly formatted
        const quoteResponse = {
          ...response.data,
          allowanceTarget: PERMIT2_ADDRESS
        };

        console.log('Formatted ERC20 quote response:', quoteResponse);
        return NextResponse.json(quoteResponse);
      }
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

      return NextResponse.json({ 
        error: 'Failed to fetch quote',
        details: apiError.response?.data || apiError.message,
        validationDetails: apiError.response?.data?.data?.details || []
      }, { status: apiError.response?.status || 500 });
    }
  } catch (error: any) {
    console.error('Quote API error:', error);
    return NextResponse.json({ 
      error: 'Failed to process quote request',
      details: error.message || 'Unknown error'
    }, { status: 500 });
  }
}
