export interface SwapQuoteResponse {
  chainId: number;
  price: string;
  guaranteedPrice: string;
  estimatedPriceImpact: string;
  liquidityAvailable: boolean;
  buyAmount: string;
  sellAmount: string;
  sources: Array<{
    name: string;
    proportion: string;
  }>;
  allowanceTarget: string;
  permit2?: {
    eip712: {
      domain: Record<string, any>;
      types: Record<string, any>;
      value: Record<string, any>;
    };
  };
  transaction: {
    to: string;
    data: string;
    value: string;
    gas: string;
    gasPrice: string;
  };
  fees?: {
    zeroExFee?: {
      amount: string;
      token: string;
      type: string;
    };
    integratorFee?: {
      amount: string;
      token: string;
      type: string;
    };
  };
} 