import { ZEROX_API_URLS, ZEROX_API_VERSIONS } from '../constants';
import axios from 'axios';
import { parseUnits } from 'ethers';

export const fetchPrice = async (
  chainId: number,
  sellToken: string,
  buyToken: string,
  sellAmount: string,
  takerAddress: string,
  slippageBps: string = '50'
) => {
  const apiVersion = ZEROX_API_VERSIONS[chainId] || 'v1';
  const baseUrl = ZEROX_API_URLS[chainId];
  
  if (!baseUrl) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }

  const params = apiVersion === 'v2' ? {
    chainId,
    sellToken,
    buyToken,
    sellAmount,
    taker: takerAddress,
    swapFeeRecipient: process.env.NEXT_PUBLIC_FEE_RECIPIENT,
    swapFeeBps: '100',
    swapFeeToken: buyToken,
    enableSlippageProtection: false
  } : {
    sellToken,
    buyToken,
    sellAmount,
    takerAddress,
    affiliateAddress: process.env.NEXT_PUBLIC_FEE_RECIPIENT,
    affiliateFeeBasisPoints: '100',
    skipValidation: false,
    slippagePercentage: (Number(slippageBps) / 10000).toString()
  };

  try {
    const endpoint = apiVersion === 'v2' ? '/swap/v1/price' : '/price';
    const response = await axios.get(`${baseUrl}${endpoint}`, {
      params,
      headers: {
        '0x-api-key': process.env.ZEROX_API_KEY || '',
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching price:', error);
    throw error;
  }
};

export const fetchQuote = async (
  chainId: number,
  sellToken: string,
  buyToken: string,
  sellAmount: string,
  takerAddress: string,
  slippageBps: string = '50'
) => {
  const apiVersion = ZEROX_API_VERSIONS[chainId] || 'v1';
  const baseUrl = ZEROX_API_URLS[chainId];
  
  if (!baseUrl) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }

  const feeBps = '15';

  const params = {
    chainId,
    sellToken,
    buyToken,
    sellAmount,
    takerAddress,
    slippagePercentage: (Number(slippageBps) / 10000).toString(),
    enableSlippageProtection: true,
    integrator: 'uruloki-dex',
    integratorFee: feeBps,
    integratorFeeRecipient: FEE_RECIPIENT,
    skipValidation: false
  };

  try {
    const endpoint = '/swap/v1/quote';
    const response = await axios.get(`${baseUrl}${endpoint}`, {
      params,
      headers: {
        '0x-api-key': process.env.ZEROX_API_KEY || '',
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching quote:', error);
    throw error;
  }
};

export const sendTransactionWithRetry = async (
  connection: Connection,
  transaction: VersionedTransaction,
  wallet: WalletContextState,
  maxRetries = 3
) => {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      // Get fresh blockhash each attempt
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
      transaction.message.recentBlockhash = blockhash;

      const signedTransaction = await wallet.signTransaction(transaction);

      // Submit via Jupiter worker
      const response = await fetch('https://worker.jup.ag/send-transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          transaction: signedTransaction.serialize().toString('base64'),
          options: {
            skipPreflight: true,
            maxRetries: 2,
            preflightCommitment: 'processed'
          }
        })
      });

      const { signature } = await response.json();

      // Wait for confirmation
      const confirmation = await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight
      }, 'confirmed');

      if (!confirmation.value.err) {
        return signature;
      }

      lastError = new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
    } catch (error) {
      lastError = error;
      console.error(`Attempt ${i + 1} failed:`, error);
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
    }
  }

  throw lastError;
}; 