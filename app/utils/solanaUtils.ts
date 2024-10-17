import { Connection, PublicKey, Transaction, TransactionSignature, Commitment, VersionedTransaction, SendOptions } from '@solana/web3.js';
import { SOLANA_RPC_ENDPOINTS } from '../constants';

export function getConnection(commitment: Commitment = 'confirmed'): Connection {
  return new Connection(SOLANA_RPC_ENDPOINTS.http, commitment);
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
  maxRetries = 1,
  commitment: Commitment = 'confirmed'
): Promise<TransactionSignature> => {
  let retries = 0;
  while (retries < maxRetries) {
    try {
      console.log(`Attempt ${retries + 1} to send and confirm transaction`);
      
      const rawTransaction = signedTransaction.serialize();
      const signature = await connection.sendRawTransaction(rawTransaction, {
        skipPreflight: true,
        maxRetries: 2,
      });
      console.log(`Transaction sent with signature: ${signature}`);

      const confirmation = await connection.confirmTransaction({
        signature,
        lastValidBlockHeight: signedTransaction.message.lastValidBlockHeight,
        blockhash: signedTransaction.message.recentBlockhash,
      }, commitment);

      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${confirmation.value.err.toString()}`);
      }

      console.log(`Transaction confirmed: ${signature}`);
      return signature;
    } catch (error) {
      console.error(`Error sending/confirming transaction (attempt ${retries + 1}):`, error);
      retries++;
      if (retries >= maxRetries) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
    }
  }
  throw new Error('Failed to send and confirm transaction after max retries');
};

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
