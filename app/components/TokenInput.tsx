import React from 'react';
import TokenImage from './TokenImage';

interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
}

interface TokenInputProps {
  label: string;
  amount: string;
  setAmount: (amount: string) => void;
  token: Token | null;
  openModal: () => void;
  readOnly?: boolean;
}

const TokenInput: React.FC<TokenInputProps> = ({ label, amount, setAmount, token, openModal, readOnly }) => {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="mt-1 relative rounded-md shadow-sm">
        <input
          type="text"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
          placeholder="0.0"
          readOnly={readOnly}
        />
        <button
          type="button"
          onClick={openModal}
          className="absolute inset-y-0 right-0 flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm"
        >
          {token ? (
            <>
              <TokenImage
                src={token.logoURI}
                alt={token.symbol}
                width={24}
                height={24}
                className="rounded-full mr-2"
              />
              {token.symbol}
            </>
          ) : (
            'Select Token'
          )}
        </button>
      </div>
    </div>
  );
};

export default TokenInput;
