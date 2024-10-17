import axios from 'axios';
import { JUPITER_QUOTE_API_URL, JUPITER_SWAP_API_URL } from '../constants';
// import { solanaWebSocket } from './solanaWebSocket';

// Define the constants
export const NATIVE_SOL_MINT = 'So11111111111111111111111111111111111111112'; // Example address for native SOL
export const WRAPPED_SOL_MINT = 'So11111111111111111111111111111111111111112'; // Example address for wrapped SOL

interface QuoteParams {
  inputMint: string;
  outputMint: string;
  amount: string;
  slippageBps?: number;
  swapMode?: 'ExactIn' | 'ExactOut';
}

interface SwapInstructionsParams {
  quoteResponse: any;
  userPublicKey: string;
  wrapUnwrapSOL?: boolean;
}

export async function fetchJupiterQuote(params: QuoteParams) {
  try {
    const response = await axios.get(JUPITER_QUOTE_API_URL, { 
      params: {
        ...params,
        amount: params.amount.toString() // Ensure amount is a string
      } 
    });
    console.log('Full Jupiter quote response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching Jupiter quote:', error);
    throw new Error('Failed to fetch Jupiter quote');
  }
}

export async function getSwapInstructions(params: SwapInstructionsParams & { slippageBps?: number }) {
  try {
    const response = await axios.post(JUPITER_SWAP_API_URL, {
      ...params,
      slippageBps: params.slippageBps || 50, // Use provided slippage or default to 0.5%
    });
    console.log('Swap instructions response:', response.data);

    // Remove WebSocket-related code
    // solanaWebSocket.send({...});

    return response.data;
  } catch (error) {
    console.error('Error getting swap instructions:', error);
    throw error;
  }
}

export const fetchSwapInstructions = async ({
  quoteResponse,
  userPublicKey,
  dynamicComputeUnitLimit = true,
  prioritizationFeeLamports = "auto",
}: {
  quoteResponse: any;
  userPublicKey: string;
  dynamicComputeUnitLimit?: boolean;
  prioritizationFeeLamports?: string | number;
}) => {
  const response = await fetch('https://quote-api.jup.ag/v6/swap', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      quoteResponse,
      userPublicKey,
      dynamicComputeUnitLimit,
      prioritizationFeeLamports,
    })
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  console.log('Swap instructions response:', data);
  return data;
};
