'use client';

import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export function WalletButton() {
  return (
    <WalletMultiButton
      className="bg-[#77be44] hover:bg-[#69a93d] text-black font-bold py-2 px-4 rounded"
    />
  );
}