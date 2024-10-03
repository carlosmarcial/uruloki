import { Address, Hex } from 'viem';

export interface PriceResponse {
  sellToken: Address;
  buyToken: Address;
  sellAmount: string;
  buyAmount: string;
  estimatedPriceImpact: string;
  grossSellAmount: string;
  grossBuyAmount: string;
  allowanceTarget: Address;
  fees: {
    integratorFee: {
      amount: string;
      token: Address;
      type: 'volume' | 'gas';
    } | null;
    zeroExFee: {
      billingType: 'on-chain' | 'off-chain';
      feeAmount: string;
      feeToken: Address;
      feeType: 'volume' | 'gas';
    };
    gasFee: null;
  };
  gas: string;
  gasPrice: string;
  tokenMetadata: {
    buyToken: {
      buyTaxBps: string | null;
      sellTaxBps: string | null;
    };
    sellToken: {
      buyTaxBps: string | null;
      sellTaxBps: string | null;
    };
  };
}

export interface QuoteResponse {
  sellToken: Address;
  buyToken: Address;
  sellAmount: string;
  buyAmount: string;
  grossSellAmount: string;
  grossBuyAmount: string;
  gasPrice: string;
  allowanceTarget: Address;
  fees: {
    integratorFee: {
      amount: string;
      token: Address;
      type: 'volume' | 'gas';
    } | null;
    zeroExFee: {
      billingType: 'on-chain' | 'off-chain';
      feeAmount: string;
      feeToken: Address;
      feeType: 'volume' | 'gas';
    };
    gasFee: null;
  };
  transaction: {
    to: Address;
    from: Address;
    data: Hex;
    value: string;
    gas: string;
    gasPrice: string;
  };
  permit2: {
    type: 'Permit2';
    hash: Hex;
    eip712: any; // You might want to define a more specific type for eip712
  };
  tokenMetadata: {
    buyToken: {
      buyTaxBps: string | null;
      sellTaxBps: string | null;
    };
    sellToken: {
      buyTaxBps: string | null;
      sellTaxBps: string | null;
    };
  };
}
