import { Connection, PublicKey, Transaction, TransactionSignature, Commitment, VersionedTransaction, SendOptions } from '@solana/web3.js';
import { SOLANA_RPC_ENDPOINTS } from '../constants';
import axios from 'axios';

export function getConnection(commitment: Commitment = 'confirmed'): Connection {
  const rpcEndpoint = process.env.NEXT_PUBLIC_SOLANA_RPC_BASE as string;
  
  return new Connection(rpcEndpoint, {
    commitment,
    fetch: async (url, options) => {
      try {
        const response = await fetch('/api/solana-rpc', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: options?.body,
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return response;
      } catch (error) {
        console.error('RPC request failed:', error);
        throw error;
      }
    },
  });
}

export function getWebSocketEndpoint(): string {
  return SOLANA_RPC_ENDPOINTS.ws;
}

export const getLatestBlockhashWithRetry = async (connection: Connection, maxRetries = 3): Promise<{ blockhash: string; lastValidBlockHeight: number }> => {
  let retries = 0;
  while (retries < maxRetries) {
    try {
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
      return { blockhash, lastValidBlockHeight };
    } catch (error) {
      console.error(`Error getting latest blockhash (attempt ${retries + 1}):`, error);
      retries++;
      if (retries >= maxRetries) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
    }
  }
  throw new Error('Failed to get latest blockhash after max retries');
};

export const sendAndConfirmTransactionWithRetry = async (
  connection: Connection,
  signedTransaction: VersionedTransaction,
  maxRetries = 3,
  commitment: Commitment = 'confirmed'
): Promise<TransactionSignature> => {
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      console.log(`Attempt ${retries + 1} to send and confirm transaction`);
      
      // Send the transaction
      const rawTransaction = signedTransaction.serialize();
      const signature = await connection.sendRawTransaction(rawTransaction, {
        skipPreflight: true,
        maxRetries: 2,
      });
      
      console.log(`Transaction sent with signature: ${signature}`);

      // First try WebSocket confirmation
      try {
        const confirmation = await Promise.race([
          connection.confirmTransaction({
            signature,
            lastValidBlockHeight: signedTransaction.message.lastValidBlockHeight,
            blockhash: signedTransaction.message.recentBlockhash,
          }, commitment),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('WebSocket timeout')), 15000)
          )
        ]);

        if (confirmation.value.err) {
          throw new Error(`Transaction failed: ${confirmation.value.err.toString()}`);
        }

        console.log(`Transaction confirmed via WebSocket: ${signature}`);
        return signature;
      } catch (wsError) {
        console.warn('WebSocket confirmation failed, falling back to polling:', wsError);
        
        // Fallback to polling
        const status = await pollTransactionStatus(connection, signature, 30);
        if (status === 'success') {
          console.log(`Transaction confirmed via polling: ${signature}`);
          return signature;
        }
        throw new Error('Transaction failed or timed out');
      }
    } catch (error) {
      console.error(`Error sending/confirming transaction (attempt ${retries + 1}):`, error);
      retries++;
      if (retries >= maxRetries) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
    }
  }
  throw new Error('Failed to send and confirm transaction after max retries');
};

// Helper function to poll transaction status
async function pollTransactionStatus(
  connection: Connection,
  signature: string,
  timeoutSeconds: number
): Promise<'success' | 'error' | 'timeout'> {
  const start = Date.now();
  
  while (Date.now() - start < timeoutSeconds * 1000) {
    try {
      const status = await checkTransactionOnExplorer(signature);
      if (status === 'success' || status === 'error') {
        return status;
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.warn('Error polling transaction status:', error);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  return 'timeout';
}

export const checkTransactionOnExplorer = async (signature: string): Promise<'success' | 'error' | 'pending'> => {
  const explorerUrl = `https://public-api.solscan.io/transaction/${signature}`;
  try {
    const response = await fetch(explorerUrl);
    const data = await response.json();
    if (data.status === 'Success') {
      return 'success';
    } else if (data.status === 'Fail') {
      return 'error';
    } else {
      return 'pending';
    }
  } catch (error) {
    console.error('Error checking transaction on Solana Explorer:', error);
    return 'pending'; // Assume pending if there's an error checking
  }
};

export const fetchSolanaTokens = async (): Promise<SolanaToken[]> => {
  try {
    const response = await axios.get('https://quote-api.jup.ag/v6/tokens');
    
    if (!response.data) {
      throw new Error('No data received from Jupiter API');
    }

    const tokens = Object.values(response.data)
      .filter((token: any) => 
        token && 
        token.address && 
        token.symbol && 
        token.name && 
        typeof token.decimals === 'number'
      )
      .map((token: any) => ({
        address: token.address,
        symbol: token.symbol,
        name: token.name,
        decimals: token.decimals,
        logoURI: token.logoURI || '',
        tags: token.tags || [],
        chainId: 'solana'
      }));

    if (!tokens.length) {
      throw new Error('No valid tokens found');
    }

    return tokens;
  } catch (error) {
    console.error('Error fetching Solana tokens:', error);
    // Return a minimal default token list instead of throwing
    return [
      {
        address: 'So11111111111111111111111111111111111111112',
        symbol: 'SOL',
        name: 'Solana',
        decimals: 9,
        logoURI: '/solana-logo.png', // Use local fallback image
        tags: ['native'],
        chainId: 'solana'
      }
    ];
  }
};

export interface SolanaToken {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI: string;
  tags: string[];
  daily_volume: number;
  chainId: 'solana';
}
