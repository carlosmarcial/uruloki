import { NextResponse } from 'next/server';
import axios from 'axios';
import { 
  ZEROX_API_VERSIONS,
  FEE_RECIPIENT 
} from '@/app/constants';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    const chainId = Number(searchParams.get('chainId'));
    const sellToken = searchParams.get('sellToken');
    const buyToken = searchParams.get('buyToken');
    const sellAmount = searchParams.get('sellAmount');
    const takerAddress = searchParams.get('takerAddress');
    
    if (!chainId || !sellToken || !buyToken || !sellAmount || !takerAddress) {
      return NextResponse.json({ 
        error: 'Missing required parameters' 
      }, { status: 400 });
    }

    const apiVersion = ZEROX_API_VERSIONS[chainId];
    const isV2 = apiVersion === 'v2';
    
    // V2 uses unified endpoint, V1 uses chain-specific endpoints
    const baseUrl = isV2 
      ? 'https://api.0x.org'
      : `https://${chainId === 43114 ? 'avalanche' : 'optimism'}.api.0x.org`;
      
    const endpoint = isV2 
      ? '/swap/permit2/quote'
      : '/swap/v1/quote';

    const params = isV2 ? {
      // V2 parameters (Optimism)
      chainId,
      sellToken,
      buyToken,
      
      
      swapFeeBps: '100',
      swapFeeRecipient: FEE_RECIPIENT,
      swapFeeToken: buyToken,
      slippageBps: '100',
      intentOnFilling: true,
      skipValidation: false
    } : {
      // V1 parameters (Avalanche)
      sellToken,
      buyToken,
      sellAmount,
      takerAddress,
      feeRecipient: FEE_RECIPIENT,
      buyTokenPercentageFee: '0.01',
      slippagePercentage: '0.01'
    };

    const headers = {
      '0x-api-key': process.env.ZEROX_API_KEY || '',
      'Accept': 'application/json',
      ...(isV2 && { '0x-version': 'v2' })  // Add version header only for v2
    };

    console.log('Sending request to 0x API:', {
      url: `${baseUrl}${endpoint}`,
      params,
      headers
    });

    const response = await axios.get(`${baseUrl}${endpoint}`, {
      params,
      headers
    });

    // Update validation to handle both v1 and v2 responses
    if (isV2 && !response.data?.transaction?.to) {
      console.error('Invalid V2 response from 0x API:', response.data);
      return NextResponse.json({ 
        error: 'Invalid response from 0x API - missing transaction details' 
      }, { status: 500 });
    }

    // For V1 (Avalanche), validate different fields
    if (!isV2 && (!response.data?.to || !response.data?.data)) {
      console.error('Invalid V1 response from 0x API:', response.data);
      return NextResponse.json({ 
        error: 'Invalid response from 0x API - missing transaction details' 
      }, { status: 500 });
    }

    // If using V1, transform the response to match V2 format
    if (!isV2) {
      const transformedResponse = {
        ...response.data,
        transaction: {
          to: response.data.to,
          data: response.data.data,
          value: response.data.value,
          gas: response.data.gas,
          gasPrice: response.data.gasPrice
        }
      };
      return NextResponse.json(transformedResponse);
    }

    return NextResponse.json(response.data);

  } catch (error: any) {
    console.error('Error in swap-price route:', error.response?.data || error);
    return NextResponse.json({ 
      error: error.response?.data?.reason || 'Failed to fetch quote',
      details: error.response?.data
    }, { status: error.response?.status || 500 });
  }
}
