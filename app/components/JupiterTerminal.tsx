'use client';

import { useEffect, useState, useCallback } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { VersionedTransaction } from '@solana/web3.js';
import Button from "./button";
import { DEFAULT_SLIPPAGE_BPS } from '../constants';
import { fetchJupiterQuote, fetchJupiterSwapInstructions as getSwapInstructions, deserializeInstruction, getAddressLookupTableAccounts } from '../utils/jupiterApi';

const jupiterAssets = [
  { name: 'SOL', mint: 'So11111111111111111111111111111111111111112', decimals: 9},
  { name: 'USDC', mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', decimals: 6},
  { name: 'BONK', mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', decimals: 5 },
  { name: 'WIF', mint: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm', decimals: 6},
  { name: 'TSUKA', mint: 'YourTsukaMintAddressHere', decimals: 6},
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
  const [fromAsset, setFromAsset] = useState(jupiterAssets[1]);
  const [toAsset, setToAsset] = useState(jupiterAssets[4]);
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState(0);
  const [quoteResponse, setQuoteResponse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { connected, publicKey, signTransaction } = useWallet();
  const { connection } = useConnection();

  const handleFromAssetChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setFromAsset(jupiterAssets.find((asset) => asset.name === event.target.value) || jupiterAssets[0]);
  };

  const handleToAssetChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setToAsset(jupiterAssets.find((asset) => asset.name === event.target.value) || jupiterAssets[0]);
  };

  const handleFromValueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
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
          `https://quote-api.jup.ag/v6/quote?inputMint=${fromAsset.mint}&outputMint=${toAsset.mint}&amount=${currentAmount * Math.pow(10, fromAsset.decimals)}&slippage=${DEFAULT_SLIPPAGE_BPS / 100}`
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
    if (!connected || !publicKey) {
      console.error('Wallet not connected');
      return;
    }

    setIsLoading(true);
    try {
      const inputAmount = Math.floor(parseFloat(fromAmount) * Math.pow(10, fromAsset.decimals));
      const quote = await fetchJupiterQuote({
        inputMint: fromAsset.mint,
        outputMint: toAsset.mint,
        amount: inputAmount.toString(),
      });

      console.log('Quote received:', quote);

      const swapInstructions = await getSwapInstructions({
        quoteResponse: quote,
        userPublicKey: publicKey.toString(),
      });

      const {
        computeBudgetInstructions,
        setupInstructions,
        swapInstruction,
        cleanupInstruction,
        addressLookupTableAddresses,
      } = swapInstructions;

      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');

      const lookupTableAccounts = await getAddressLookupTableAccounts(
        connection,
        addressLookupTableAddresses || []
      );

      const messageV0 = new TransactionMessage({
        payerKey: publicKey,
        recentBlockhash: blockhash,
        instructions: [
          ...(computeBudgetInstructions || []).map(deserializeInstruction),
          ...(setupInstructions || []).map(deserializeInstruction),
          deserializeInstruction(swapInstruction),
          ...(cleanupInstruction ? [deserializeInstruction(cleanupInstruction)] : []),
        ],
      }).compileToV0Message(lookupTableAccounts);

      const transaction = new VersionedTransaction(messageV0);

      const signed = await signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signed.serialize());

      const confirmation = await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight
      });

      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${confirmation.value.err}`);
      }

      console.log(`https://solscan.io/tx/${signature}`);
    } catch (error) {
      console.error('Swap failed:', error);
      throw error;
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
              type="text"
              value={fromAmount}
              onChange={handleFromValueChange}
              className="flex-grow bg-input text-foreground rounded-md p-2"
              placeholder="0"
            />
            <select
              value={fromAsset.name}
              onChange={handleFromAssetChange}
              className="bg-input text-foreground rounded-md p-2"
            >
              {jupiterAssets.map((asset) => (
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
              {jupiterAssets.map((asset) => (
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