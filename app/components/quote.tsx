import React, { useEffect } from 'react';
import { useSignTypedData, useSendTransaction, useTransaction } from 'wagmi';
import { Address, Hex, concat, numberToHex, size } from 'viem';
import type { PriceResponse, QuoteResponse } from '../../src/utils/types';
import { MAINNET_TOKENS_BY_SYMBOL, FEE_RECIPIENT, AFFILIATE_FEE } from '../../src/constants';
import qs from 'qs';

export default function QuoteView({
  taker,
  price,
  quote,
  setQuote,
  chainId,
}: {
  taker: Address | undefined;
  price: PriceResponse;
  quote: QuoteResponse | undefined;
  setQuote: (quote: QuoteResponse) => void;
  chainId: number;
}) {
  const { signTypedDataAsync } = useSignTypedData();
  const { sendTransactionAsync } = useSendTransaction();
  const { data: transactionData, isLoading, isSuccess } = useTransaction({
    hash: quote?.transaction?.hash as `0x${string}` | undefined,
  });

  const handleSubmitTransaction = async () => {
    // Implementation here
  };

  useEffect(() => {
    const fetchQuote = async () => {
      if (price && taker) {
        const params = {
          sellToken: price.sellToken,
          buyToken: price.buyToken,
          sellAmount: price.sellAmount,
          takerAddress: taker,
          feeRecipient: FEE_RECIPIENT,
          buyTokenPercentageFee: AFFILIATE_FEE,
        };

        const response = await fetch(`/api/quote?${qs.stringify(params)}`);
        const data = await response.json();
        setQuote(data);
      }
    };

    fetchQuote();
  }, [price, taker, setQuote]);

  return (
    <div>
      {quote ? (
        <>
          <h2>Quote Details</h2>
          <p>Sell: {quote.sellAmount} {MAINNET_TOKENS_BY_SYMBOL[quote.sellToken].symbol}</p>
          <p>Buy: {quote.buyAmount} {MAINNET_TOKENS_BY_SYMBOL[quote.buyToken].symbol}</p>
          <p>Price: {Number(quote.buyAmount) / Number(quote.sellAmount)} {MAINNET_TOKENS_BY_SYMBOL[quote.buyToken].symbol} per {MAINNET_TOKENS_BY_SYMBOL[quote.sellToken].symbol}</p>
          <button
            onClick={handleSubmitTransaction}
            disabled={!quote || isLoading}
          >
            {isLoading ? 'Submitting...' : 'Submit Transaction'}
          </button>
          {isSuccess && <p>Transaction successful! Hash: {transactionData?.hash}</p>}
        </>
      ) : (
        <p>Loading quote...</p>
      )}
    </div>
  );
}