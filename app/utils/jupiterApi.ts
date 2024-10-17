import axios from 'axios';
import { JUPITER_QUOTE_API_URL, JUPITER_SWAP_API_URL } from '../constants';
import { PublicKey } from '@solana/web3.js';

// Define the constants
export const NATIVE_SOL_MINT = 'So11111111111111111111111111111111111111112'; // Example address for native SOL
export const WRAPPED_SOL_MINT = 'So11111111111111111111111111111111111111112'; // Example address for wrapped SOL

interface QuoteParams {
  inputMint: string;
  outputMint: string;
  amount: string;
  slippageBps?: number;
  feeBps?: number;
}

export async function fetchJupiterQuote(params: QuoteParams) {
  const queryParams = new URLSearchParams({
    inputMint: params.inputMint,
    outputMint: params.outputMint,
    amount: params.amount,
  });

  if (params.slippageBps !== undefined) {
    queryParams.append('slippageBps', params.slippageBps.toString());
  }

  if (params.feeBps !== undefined) {
    queryParams.append('feeBps', params.feeBps.toString());
  }

  console.log('Fetching Jupiter quote with params:', params);
  console.log('Full URL:', `${JUPITER_QUOTE_API_URL}?${queryParams}`);

  try {
    const response = await fetch(`${JUPITER_QUOTE_API_URL}?${queryParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Jupiter quote response:', data);

    if (!data) {
      throw new Error('Empty response from Jupiter API');
    }

    // Check if the response has the expected structure
    if (!data.data && !data.outAmount) {
      console.error('Unexpected response structure:', data);
      throw new Error('Unexpected response structure from Jupiter API');
    }

    // If the response has a 'data' property, return that, otherwise return the whole response
    return data.data || data;
  } catch (error) {
    console.error('Error fetching Jupiter quote:', error);
    throw error;
  }
}

export const fetchSwapInstructions = async ({
  quoteResponse,
  userPublicKey,
  wrapUnwrapSOL = true,
  feeAccount,
  computeUnitPriceMicroLamports = 'auto'
}: {
  quoteResponse: any;
  userPublicKey: string;
  wrapUnwrapSOL?: boolean;
  feeAccount?: string;
  computeUnitPriceMicroLamports?: number | 'auto';
}) => {
  try {
    const response = await fetch('/api/jupiter/swap', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        quoteResponse,
        userPublicKey,
        wrapUnwrapSOL,
        feeAccount,
        computeUnitPriceMicroLamports,
        asLegacyTransaction: false
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`HTTP error! status: ${response.status}, message: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    console.log('Swap instructions response:', data);
    return data;
  } catch (error) {
    console.error('Error fetching swap instructions:', error);
    throw error;
  }
};

export const getInputMint = (tokenAddress: string) => {
  return tokenAddress === NATIVE_SOL_MINT ? WRAPPED_SOL_MINT : tokenAddress;
};

export const getOutputMint = (tokenAddress: string) => {
  return tokenAddress === NATIVE_SOL_MINT ? WRAPPED_SOL_MINT : tokenAddress;
};

export const fetchJupiterSwapInstructions = async (quoteResponse: any, userPublicKey: string) => {
  console.log('Fetching swap instructions with params:', { quoteResponse, userPublicKey });
  
  const response = await fetch('https://quote-api.jup.ag/v6/swap-instructions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      quoteResponse,
      userPublicKey,
      wrapAndUnwrapSol: true,
    })
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  console.log('Swap instructions response:', data);

  return data;
};
