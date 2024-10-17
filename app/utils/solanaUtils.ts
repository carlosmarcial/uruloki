import { Connection, PublicKey, Transaction, TransactionSignature, Keypair, Commitment } from '@solana/web3.js';
import { retry } from './retry';
import { SOLANA_RPC_ENDPOINT } from '../constants';

export const getConnection = (): Connection => {
  return new Connection(SOLANA_RPC_ENDPOINT, 'confirmed');
};

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
  transaction: Transaction,
  signers: Keypair[],
  commitment: Commitment = 'confirmed'
): Promise<TransactionSignature> => {
  const { blockhash, lastValidBlockHeight } = await getLatestBlockhashWithRetry(connection);
  transaction.recentBlockhash = blockhash;
  transaction.lastValidBlockHeight = lastValidBlockHeight;

  transaction.sign(...signers);

  const rawTransaction = transaction.serialize();

  const signature = await connection.sendRawTransaction(rawTransaction, {
    skipPreflight: true,
    maxRetries: 3,
  });

  await connection.confirmTransaction({
    signature,
    blockhash,
    lastValidBlockHeight,
  }, commitment);

  return signature;
};
