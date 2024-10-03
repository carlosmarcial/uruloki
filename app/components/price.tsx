import React, { useState, useEffect } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { formatUnits, parseUnits } from 'viem';
import TokenSelector from '../token-list/TokenSelector';
import { MAINNET_TOKENS_BY_SYMBOL, FEE_RECIPIENT, AFFILIATE_FEE } from '../../src/constants';
import type { PriceResponse } from '../../src/utils/types';
import { Address } from 'viem';
import qs from 'qs';

export default function PriceView({
  price,
  taker,
  setPrice,
  setFinalize,
  chainId,
}: {
  price: PriceResponse | null;
  taker: Address | undefined;
  setPrice: (price: PriceResponse) => void;
  setFinalize: (finalize: boolean) => void;
  chainId: number;
}) {
  const [sellToken, setSellToken] = useState('WETH');
  const [buyToken, setBuyToken] = useState('USDC');
  const [sellAmount, setSellAmount] = useState('');
  const [buyAmount, setBuyAmount] = useState('');

  const { address } = useAccount();
  const sellTokenAddress = MAINNET_TOKENS_BY_SYMBOL[sellToken].address;
  const { data: balance } = useBalance({
    address,
    token: sellTokenAddress,
  });

  useEffect(() => {
    // Fetch price data here
    const fetchPrice = async () => {
      if (sellAmount && taker) {
        const params = {
          sellToken: sellTokenAddress,
          buyToken: MAINNET_TOKENS_BY_SYMBOL[buyToken].address,
          sellAmount: parseUnits(sellAmount, MAINNET_TOKENS_BY_SYMBOL[sellToken].decimals).toString(),
          takerAddress: taker,
          feeRecipient: FEE_RECIPIENT,
          buyTokenPercentageFee: AFFILIATE_FEE,
        };

        const response = await fetch(`/api/price?${qs.stringify(params)}`);
        const data = await response.json();
        setPrice(data);
        setBuyAmount(formatUnits(data.buyAmount, MAINNET_TOKENS_BY_SYMBOL[buyToken].decimals));
      }
    };

    fetchPrice();
  }, [sellToken, buyToken, sellAmount, taker, setPrice]);

  return (
    <div>
      <ConnectButton />
      <TokenSelector
        label="Sell"
        selectedTokenSymbol={sellToken}
        onSelectToken={setSellToken}
        amount={sellAmount}
        onAmountChange={setSellAmount}
      />
      <TokenSelector
        label="Buy"
        selectedTokenSymbol={buyToken}
        onSelectToken={setBuyToken}
        amount={buyAmount}
        readOnly={true}
      />
      {/* ... (implement other UI elements like fees display) */}
      <button
        onClick={() => setFinalize(true)}
        disabled={!price || !taker}
      >
        Review Trade
      </button>
    </div>
  );
}