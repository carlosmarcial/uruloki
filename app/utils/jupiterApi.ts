import axios from 'axios';
import { JUPITER_QUOTE_API_URL, JUPITER_SWAP_API_URL } from '../constants';
import { PublicKey } from '@solana/web3.js';

// Define the constants
export const NATIVE_SOL_MINT = '11111111111111111111111111111111';
export const WRAPPED_SOL_MINT = 'So11111111111111111111111111111111111111112'; // Example address for wrapped SOL

interface QuoteParams {
  inputMint: string;
  outputMint: string;
  amount: string;
  slippageBps: number;
  maxAccounts?: number;
}

export const fetchJupiterQuote = async (params: QuoteParams) => {
  const { inputMint, outputMint, amount, slippageBps, maxAccounts } = params;
  const endpoint = `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=${slippageBps}${maxAccounts ? `&maxAccounts=${maxAccounts}` : ''}`;
  
  console.log('Fetching Jupiter quote with URL:', endpoint);

  try {
    const response = await fetch(endpoint);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Jupiter API error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error in fetchJupiterQuote:', error);
    throw error;
  }
};

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
