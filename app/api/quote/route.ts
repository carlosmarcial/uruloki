import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { PERMIT2_ADDRESS } from '@/app/constants';

// Fee recipient constants
const FEE_RECIPIENT = '0x765d4129bbe4C9b134f307E2B10c6CF75Fe0e2f6';
const AFFILIATE_FEE = '0.01'; // 1%

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sellToken = searchParams.get('sellToken');
    const buyToken = searchParams.get('buyToken');
    const sellAmount = searchParams.get('sellAmount');
    const taker = searchParams.get('taker');
    const chainId = searchParams.get('chainId');
    const slippageBps = searchParams.get('slippageBps');

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
      
      if (isEthTrade) {
        // For ETH trades, use v1 quote endpoint
        const apiParams = {
          sellToken: 'ETH',
          buyToken: buyToken,
          sellAmount,
          takerAddress: taker,
          chainId: Number(chainId),
          affiliateAddress: FEE_RECIPIENT,
          affiliateFee: AFFILIATE_FEE,
          skipValidation: false,
          slippagePercentage: Number(slippageBps) / 10000
        };

        console.log('Requesting ETH quote with params:', apiParams);

        const response = await axios.get('https://api.0x.org/swap/v1/quote', {
          params: apiParams,
          headers: {
            '0x-api-key': process.env.ZEROX_API_KEY
          }
        });

        console.log('Raw ETH quote response:', response.data);

        // Validate the response
        if (!response.data || !response.data.to || !response.data.data) {
          console.error('Invalid quote response:', response.data);
          throw new Error('Invalid quote response from 0x API');
        }

        // Format the response exactly as expected by the frontend
        const transactionRequest = {
          to: response.data.to,
          data: response.data.data,
          value: sellToken.toLowerCase() === 'eth' ? sellAmount : '0',
          gas: response.data.gas || response.data.estimatedGas,
          gasPrice: response.data.gasPrice,
          from: taker,
          chainId: Number(chainId)
        };

        // Return the exact structure the frontend expects
        const quoteResponse = {
          ...response.data, // Include all original fields
          transaction: transactionRequest, // Wrap transaction fields in a transaction object
          sellAmount: response.data.sellAmount,
          buyAmount: response.data.buyAmount,
          allowanceTarget: '0x0000000000000000000000000000000000000000',
          price: response.data.price,
          guaranteedPrice: response.data.guaranteedPrice,
          estimatedPriceImpact: response.data.estimatedPriceImpact,
          sources: response.data.sources,
          buyTokenAddress: response.data.buyTokenAddress,
          sellTokenAddress: response.data.sellTokenAddress,
          protocolFee: response.data.protocolFee || '0',
          minimumProtocolFee: response.data.minimumProtocolFee || '0'
        };

        console.log('Final formatted quote response:', quoteResponse);
        return NextResponse.json(quoteResponse);

      } else {
        // Use permit2 endpoint for ERC20-to-ERC20 trades
        const response = await axios.get('https://api.0x.org/swap/permit2/quote', {
          params: {
            sellToken: sellToken,
            buyToken: buyToken,
            sellAmount,
            taker,
            slippageBps: Number(slippageBps),
            chainId: Number(chainId),
            feeRecipient: FEE_RECIPIENT,
            buyTokenPercentageFee: AFFILIATE_FEE
          },
          headers: {
            '0x-api-key': process.env.ZEROX_API_KEY,
            '0x-version': 'v2'
          }
        });

        console.log('ERC20 trade quote response:', response.data);

        return NextResponse.json({
          ...response.data,
          allowanceTarget: PERMIT2_ADDRESS
        });
      }

    } catch (apiError: any) {
      console.error('0x API Error:', {
        status: apiError.response?.status,
        data: apiError.response?.data,
        message: apiError.message,
        url: apiError.config?.url,
        params: apiError.config?.params
      });

      if (apiError.response?.data) {
        return NextResponse.json({ 
          error: 'Error from 0x API',
          details: apiError.response.data
        }, { status: apiError.response.status });
      }

      return NextResponse.json({ 
        error: 'Failed to fetch quote',
        details: apiError.message
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Quote API error:', error);
    return NextResponse.json({ 
      error: 'Failed to process quote request',
      details: error.message || 'Unknown error'
    }, { status: 500 });
  }
}
