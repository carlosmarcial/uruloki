'use client';

import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export function WalletButton() {
  return (
    <div className="flex justify-start">
      <WalletMultiButton
        className="py-3 px-6 rounded-sm font-bold text-base w-[152px] bg-[#77be44] hover:bg-[#69aa3b] text-white transition-colors"
      />
    </div>
  );
}