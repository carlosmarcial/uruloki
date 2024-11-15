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
    
    // Validate required parameters
    if (!chainId || !sellToken || !buyToken || !sellAmount || !takerAddress) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const affiliateAddress = '0x765d4129bbe4C9b134f307E2B10c6CF75Fe0e2f6';
    
    // Determine API version and base URL based on chain
    let baseUrl;
    let useV2 = false;
    
    switch (chainId) {
      case 1: // Ethereum
      case 137: // Polygon
      case 10: // Optimism
      case 42161: // Arbitrum
        baseUrl = 'https://api.0x.org';
        useV2 = true;
        break;
      case 43114: // Avalanche
        baseUrl = 'https://avalanche.api.0x.org';
        useV2 = false;
        break;
      default:
        return NextResponse.json({ error: 'Unsupported chain ID' }, { status: 400 });
    }

    // Base parameters for both versions
    const baseParams = {
      sellToken,
      buyToken,
      sellAmount
    };

    // Version specific parameters
    const versionParams = useV2 ? {
      taker: takerAddress,
      chainId: chainId.toString(),
      swapFeeRecipient: affiliateAddress,
      swapFeeBps: '100',
      swapFeeToken: buyToken,
      slippageBps: '100'
    } : {
      takerAddress,
      affiliateAddress: affiliateAddress,
      feeRecipient: affiliateAddress,
      buyTokenPercentageFee: '0.01',
      feeRecipientTradeSurplus: affiliateAddress,
      slippagePercentage: '0.01'
    };

    // Combine parameters
    const params = new URLSearchParams({
      ...baseParams,
      ...versionParams
    });

    // Construct URL based on version
    const apiUrl = useV2 ? 
      `${baseUrl}/swap/permit2/quote` : 
      `${baseUrl}/swap/v1/quote`;

    const headers: Record<string, string> = {
      '0x-api-key': process.env.ZEROX_API_KEY || '',
      'Accept': 'application/json'
    };

    if (useV2) {
      headers['0x-version'] = 'v2';
    }

    const response = await axios.get(`${apiUrl}?${params}`, { headers });
    
    // For v1 (Avalanche), ensure transaction details are in the expected format
    if (!useV2 && response.data) {
      return NextResponse.json({
        ...response.data,
        transaction: {
          to: response.data.to,
          from: response.data.from || takerAddress,
          data: response.data.data,
          value: response.data.value || '0',
          gas: response.data.gas,
          gasPrice: response.data.gasPrice
        }
      });
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
