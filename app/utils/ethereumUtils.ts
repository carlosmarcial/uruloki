import { formatUnits, parseUnits } from 'viem';
import { TokenData } from '@/app/types/token';

export const calculatePriceImpact = (
  sellAmount: string,
  buyAmount: string,
  sellToken: TokenData,
  buyToken: TokenData,
  sellPrice: number,
  buyPrice: number
): number => {
  if (!sellAmount || !buyAmount || !sellPrice || !buyPrice) return 0;

  const sellValue = Number(sellAmount) * sellPrice;
  const buyValue = Number(buyAmount) * buyPrice;
  
  return ((sellValue - buyValue) / sellValue) * 100;
};

export const formatGasEstimate = (gasEstimate: bigint, gasPrice: bigint): string => {
  const gasCost = gasEstimate * gasPrice;
  return formatUnits(gasCost, 18);
};

export const getMinimumReceived = (
  amount: string,
  decimals: number,
  slippagePercentage: number
): string => {
  const parsedAmount = parseUnits(amount, decimals);
  const slippageFactor = 1 - (slippagePercentage / 100);
  const minAmount = (parsedAmount * BigInt(Math.floor(slippageFactor * 10000))) / BigInt(10000);
  return formatUnits(minAmount, decimals);
};

export const isHighPriceImpact = (priceImpact: number): boolean => {
  return priceImpact > 2; // Consider anything over 2% as high impact
}; 