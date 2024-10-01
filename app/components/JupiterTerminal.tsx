'use client';

import { useEffect, useState, useCallback } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { VersionedTransaction } from '@solana/web3.js';
import { Button } from "./button";

const assets = [
  { name: 'SOL', mint: 'So11111111111111111111111111111111111111112', decimals: 9},
  { name: 'USDC', mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', decimals: 6},
  { name: 'BONK', mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', decimals: 5 },
  { name: 'WIF', mint: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm', decimals: 6},
];

const debounce = <T extends unknown[]>(
  func: (...args: T) => void,
  wait: number
) => {
  let timeout: NodeJS.Timeout | undefined;

  return (...args: T) => {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

const JupiterTerminal = () => {
  const [fromAsset, setFromAsset] = useState(assets[0]);
  const [toAsset, setToAsset] = useState(assets[1]);
  const [fromAmount, setFromAmount] = useState(''); // Changed to empty string
  const [toAmount, setToAmount] = useState(0);
  const [quoteResponse, setQuoteResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const { connected, publicKey, signTransaction } = useWallet();
  const { connection } = useConnection();

  const handleFromAssetChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setFromAsset(assets.find((asset) => asset.name === event.target.value) || assets[0]);
  };

  const handleToAssetChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setToAsset(assets.find((asset) => asset.name === event.target.value) || assets[0]);
  };

  const handleFromValueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    // Allow empty string or valid numbers
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setFromAmount(value);
    }
  };

  const debounceQuoteCall = useCallback(debounce(getQuote, 500), [fromAsset, toAsset]);

  useEffect(() => {
    if (fromAmount !== '') {
      debounceQuoteCall(parseFloat(fromAmount));
    } else {
      setToAmount(0);
    }
  }, [fromAmount, debounceQuoteCall]);

  async function getQuote(currentAmount: number) {
    if (isNaN(currentAmount) || currentAmount <= 0) {
      console.error('Invalid fromAmount value:', currentAmount);
      return;
    }

    setIsLoading(true);
    try {
      const quote = await (
        await fetch(
          `https://quote-api.jup.ag/v6/quote?inputMint=${fromAsset.mint}&outputMint=${toAsset.mint}&amount=${currentAmount * Math.pow(10, fromAsset.decimals)}&slippage=0.5`
        )
      ).json();

      if (quote && quote.outAmount) {
        const outAmountNumber =
          Number(quote.outAmount) / Math.pow(10, toAsset.decimals);
        setToAmount(outAmountNumber);
      }

      setQuoteResponse(quote);
    } catch (error) {
      console.error('Error fetching quote:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSwap() {
    if (!connected) {
      console.error('Wallet is not connected');
      return;
    }
    await signAndSendTransaction();
  }

  async function signAndSendTransaction() {
    if (!connected || !signTransaction || !publicKey) {
      console.error('Wallet is not connected or does not support signing transactions');
      return;
    }

    setIsLoading(true);
    try {
      const { swapTransaction } = await (
        await fetch('https://quote-api.jup.ag/v6/swap', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            quoteResponse,
            userPublicKey: publicKey.toString(),
            wrapAndUnwrapSol: true,
          }),
        })
      ).json();

      const swapTransactionBuf = Buffer.from(swapTransaction, 'base64');
      const transaction = VersionedTransaction.deserialize(swapTransactionBuf);
      const signedTransaction = await signTransaction(transaction);

      const rawTransaction = signedTransaction.serialize();
      const txid = await connection.sendRawTransaction(rawTransaction, {
        skipPreflight: true,
        maxRetries: 2,
      });

      const latestBlockHash = await connection.getLatestBlockhash();
      await connection.confirmTransaction({
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
        signature: txid
      }, 'confirmed');
      
      console.log(`https://solscan.io/tx/${txid}`);
    } catch (error) {
      console.error('Error signing or sending the transaction:', error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="bg-background p-6 rounded-lg shadow-lg">
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">Sell</label>
          <div className="flex space-x-2">
            <input
              type="text" // Changed to text
              value={fromAmount}
              onChange={handleFromValueChange}
              className="flex-grow bg-input text-foreground rounded-md p-2"
              placeholder="0" // Added placeholder
            />
            <select
              value={fromAsset.name}
              onChange={handleFromAssetChange}
              className="bg-input text-foreground rounded-md p-2"
            >
              {assets.map((asset) => (
                <option key={asset.mint} value={asset.name}>
                  {asset.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">Buy</label>
          <div className="flex space-x-2">
            <input
              type="number"
              value={toAmount}
              className="flex-grow bg-input text-foreground rounded-md p-2"
              readOnly
            />
            <select
              value={toAsset.name}
              onChange={handleToAssetChange}
              className="bg-input text-foreground rounded-md p-2"
            >
              {assets.map((asset) => (
                <option key={asset.mint} value={asset.name}>
                  {asset.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex justify-center items-center">
          <Button
            onClick={handleSwap}
            disabled={!connected || toAsset.mint === fromAsset.mint || isLoading || parseFloat(fromAmount) <= 0}
            className="w-full bg-[#77be44] hover:bg-[#69a93d] text-black font-bold py-2 px-4 rounded"
          >
            {isLoading ? 'Loading...' : 'Swap'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default JupiterTerminal;