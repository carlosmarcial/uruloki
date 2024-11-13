import { Connection, PublicKey, TransactionInstruction } from '@solana/web3.js';
import { 
  DEFAULT_SLIPPAGE_BPS, 
  JUPITER_QUOTE_API_URL,
  JUPITER_SWAP_API_URL,
  JUPITER_SWAP_INSTRUCTIONS_API_URL,
  NATIVE_SOL_MINT,
  WRAPPED_SOL_MINT
} from '../constants';

export const getInputMint = (tokenAddress: string) => {
  return tokenAddress === NATIVE_SOL_MINT ? WRAPPED_SOL_MINT : tokenAddress;
};

export const getOutputMint = (tokenAddress: string) => {
  return tokenAddress === NATIVE_SOL_MINT ? WRAPPED_SOL_MINT : tokenAddress;
};

interface JupiterQuoteResponse {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  platformFee?: any;
  priceImpactPct: number;
  routePlan: any[];
  contextSlot?: number;
  timeTaken?: number;
}

export const fetchJupiterQuote = async ({
  inputMint,
  outputMint,
  amount,
  slippageBps = 50,
  maxAccounts = 64
}: {
  inputMint: string;
  outputMint: string;
  amount: number;
  slippageBps?: number;
  maxAccounts?: number;
}) => {
  try {
    const url = new URL(JUPITER_QUOTE_API_URL);
    
    // Add query parameters
    const params = {
      inputMint,
      outputMint,
      amount: Math.round(amount).toString(),
      slippageBps: slippageBps.toString(),
      maxAccounts: maxAccounts.toString()
    };
    
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    console.log('Fetching Jupiter quote with URL:', url.toString());

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Jupiter quote API error: ${response.status}, ${errorText}`);
    }

    const data = await response.json();
    
    if (!data || !data.outAmount) {
      console.error('Invalid quote response:', data);
      throw new Error('Invalid quote format received');
    }

    return data;
  } catch (error) {
    console.error('Error fetching Jupiter quote:', error);
    throw error;
  }
};

// Add this interface for the swap request
interface SwapRequestBody {
  quoteResponse: any;
  userPublicKey: string;
  wrapUnwrapSOL?: boolean;
  computeUnitPriceMicroLamports?: number | null;
  asLegacyTransaction?: boolean;
}

interface SwapInstructionsRequest {
  swapRequest: SwapRequestBody;
}

interface SwapInstructionsResponse {
  swapTransaction: string;
  lastValidBlockHeight: number;
  prioritizationFeeLamports?: number;
  computeUnitLimit?: number;
  prioritizationType?: {
    priorityFee?: number;
    computeUnits?: number;
  };
}

export const fetchJupiterSwapInstructions = async ({ swapRequest }: SwapInstructionsRequest): Promise<SwapInstructionsResponse> => {
  try {
    const response = await fetch(`${JUPITER_SWAP_API_URL}/swap`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(swapRequest)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Swap instructions API error: ${response.status}, ${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching swap instructions:', error);
    throw error;
  }
};

export const deserializeInstruction = (instruction: any): TransactionInstruction => {
  return new TransactionInstruction({
    programId: new PublicKey(instruction.programId),
    keys: instruction.accounts.map((key: any) => ({
      pubkey: new PublicKey(key.pubkey),
      isSigner: key.isSigner,
      isWritable: key.isWritable,
    })),
    data: Buffer.from(instruction.data, 'base64'),
  });
};

export const getAddressLookupTableAccounts = async (
  connection: Connection,
  addresses: string[]
) => {
  const accounts = await Promise.all(
    addresses.map(async (address) => {
      const accountInfo = await connection.getAccountInfo(new PublicKey(address));
      if (!accountInfo) return null;
      return {
        key: new PublicKey(address),
        state: accountInfo.data,
      };
    })
  );
  return accounts.filter(Boolean);
};
