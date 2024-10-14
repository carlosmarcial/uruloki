'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ChevronDown, ArrowUpDown, Search, X, Wallet, ArrowUp } from "lucide-react";
import Image from "next/image";
import { useAccount, useBalance, useChainId, useConnect, useDisconnect, useContractRead, useWaitForTransactionReceipt, useConfig, useWriteContract, useEstimateGas, useSignTypedData, useSendTransaction, usePublicClient } from 'wagmi';
import { useSimulateContract } from 'wagmi';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { formatUnits, parseUnits } from "viem";
import { erc20Abi } from '@app/abis/erc20Abi';
import { Address } from 'viem';
import { MAINNET_TOKENS, MAX_ALLOWANCE, MAINNET_EXCHANGE_PROXY } from "../../src/constants";
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import TokenChart, { TokenChartRef } from './TokenChart';
import TokenSelector from '../token-list/TokenSelector';
import { fetchTokenList, Token } from '@/lib/fetchTokenList';
import { fetchTokenPrice } from '../utils/priceUtils';
import { EXCHANGE_PROXY_ABI, EXCHANGE_PROXY_ADDRESSES, ERC20_ABI } from '@app/constants';
import TokenSelectModal from '@/app/components/TokenSelectModal';
import { simulateContract, waitForTransactionReceipt } from 'wagmi/actions';
import ChainToggle from './ChainToggle';
import MainTrading from './ChainToggle';
import { WalletButton } from './WalletButton';
import TokenImage from './TokenImage';
import { mainnet, polygon, optimism, arbitrum, base, avalanche, bsc, linea, mantle, scroll } from 'wagmi/chains';

// Add these animation variants
const containerVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
      when: "beforeChildren",
      staggerChildren: 0.1
    }
  },
  exit: { 
    opacity: 0, 
    y: 50,
    transition: {
      duration: 0.3,
      ease: "easeIn"
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut"
    }
  }
};

interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
}

interface SolanaToken {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI: string;
  tags: string[];
  daily_volume: number;
}

export default function UnifiedSwapInterface({ activeChain, setActiveChain }: {
  activeChain: 'ethereum' | 'solana';
  setActiveChain: (chain: 'ethereum' | 'solana') => void;
}) {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [solanaTokens, setSolanaTokens] = useState<SolanaToken[]>([]);
  const [sellToken, setSellToken] = useState<Token | SolanaToken | null>(null);
  const [buyToken, setBuyToken] = useState<Token | SolanaToken | null>(null);
  const [sellAmount, setSellAmount] = useState<string>('');
  const [buyAmount, setBuyAmount] = useState<string>('');
  const [isTokenSelectModalOpen, setIsTokenSelectModalOpen] = useState(false);
  const [selectingTokenFor, setSelectingTokenFor] = useState<'sell' | 'buy' | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"sell" | "buy">("sell");
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('swap');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAnalyzeModalOpen, setIsAnalyzeModalOpen] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  
  const [approvalState, setApprovalState] = useState<'idle' | 'needed' | 'approving' | 'approved'>('idle');
  const [approveRequest, setApproveRequest] = useState<any>(null);
  
  const chartRef = useRef<TokenChartRef>(null);
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const config = useConfig();
  const publicClient = usePublicClient();
  const { signTypedDataAsync } = useSignTypedData();
  const { sendTransactionAsync } = useSendTransaction();
  const { waitForTransactionReceipt } = useWaitForTransactionReceipt();

  // Solana wallet
  const solanaWallet = useWallet();

  const exchangeProxyAddress = EXCHANGE_PROXY_ADDRESSES[chainId];

  const { data: allowance, refetch: refetchAllowance } = useContractRead({
    address: sellToken?.address,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [address, exchangeProxyAddress],
    watch: true,
    enabled: !!sellToken && !!address && !!chainId && !!exchangeProxyAddress && activeChain === 'ethereum',
  });

  const { writeContract: approveToken, data: approveData } = useWriteContract();

  const { isLoading: isApproving, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({
    hash: approveData?.hash,
  });

  const { writeContract, data: swapData, isLoading: isSwapPending, isError: isSwapError } = useWriteContract();

  const { isLoading: isSwapLoading, isSuccess: isSwapSuccess } = useWaitForTransactionReceipt({
    hash: swapData?.hash,
  });

  const { estimateGas } = useEstimateGas();

  // Check if approval is needed and prepare approval request
  useEffect(() => {
    if (sellToken && sellAmount && allowance !== undefined && exchangeProxyAddress) {
      const sellAmountBigInt = parseUnits(sellAmount, sellToken.decimals);
      if (sellAmountBigInt > allowance) {
        setApprovalState('needed');
        setApproveRequest({
          address: sellToken.address,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [exchangeProxyAddress, sellAmountBigInt],
        });
      } else {
        setApprovalState('approved');
        setApproveRequest(null);
      }
    }
  }, [sellToken, sellAmount, allowance, exchangeProxyAddress]);

  // Handle approval success
  useEffect(() => {
    if (isApproveSuccess) {
      setApprovalState('approved');
      refetchAllowance();
    }
  }, [isApproveSuccess, refetchAllowance]);

  const handleApprove = useCallback(() => {
    if (approveRequest) {
      approveToken(approveRequest);
      setApprovalState('approving');
    }
  }, [approveRequest, approveToken]);

  const [swapError, setSwapError] = useState<string | null>(null);

  const handleSwap = async () => {
    console.log('handleSwap function called');
    if (!isConnected || !sellToken || !buyToken || !sellAmount || !address || !chainId) {
      console.log('Missing required data for swap');
      return;
    }

    try {
      console.log('Fetching swap quote with params:', {
        chainId,
        sellToken: sellToken.address,
        buyToken: buyToken.address,
        sellAmount: parseUnits(sellAmount, sellToken.decimals).toString(),
        takerAddress: address,
      });

      const response = await axios.get('/api/swap-price', {
        params: {
          chainId,
          sellToken: sellToken.address,
          buyToken: buyToken.address,
          sellAmount: parseUnits(sellAmount, sellToken.decimals).toString(),
          takerAddress: address,
          affiliateAddress: '0x765d4129bbe4C9b134f307E2B10c6CF75Fe0e2f6',
          affiliateFee: '0.01', // 1% fee
        }
      });

      console.log('Swap quote received:', response.data);

      const quote = response.data;

      // Update the UI with the buy amount
      setBuyAmount(quote.buyAmount);

      let signature: string | undefined;
      if (quote.permit2 && quote.permit2.eip712) {
        // Sign the permit2 message
        signature = await signTypedDataAsync(quote.permit2.eip712);
        console.log('Signature:', signature);
      } else {
        console.log('No permit2 data in the quote, proceeding without signature');
      }

      // Prepare transaction data
      let txData = quote.data;
      if (signature) {
        const MAGIC_CALLDATA_STRING = "f".repeat(130);
        txData = quote.data.replace(MAGIC_CALLDATA_STRING, signature.slice(2)) as `0x${string}`;
      }

      // Send the transaction
      const { hash } = await sendTransactionAsync({
        to: quote.to as `0x${string}`,
        data: txData,
        value: BigInt(quote.value || 0),
        gas: BigInt(quote.gas || 0),
      });

      console.log('Transaction sent:', hash);

      // Wait for the transaction to be mined
      const receipt = await waitForTransactionReceipt({ hash });
      console.log('Transaction mined:', receipt);

      // Update UI or state to reflect successful swap
      // ...

    } catch (error) {
      console.error('Swap failed:', error);
      if (axios.isAxiosError(error) && error.response) {
        console.error('Error response:', error.response.data);
        console.error('Error status:', error.response.status);
        console.error('Error headers:', error.response.headers);
      }
      setSwapError(error.response?.data?.error || error.message || 'An unknown error occurred');
    }
  };

  const swapTokens = () => {
    setSellToken(buyToken);
    setBuyToken(sellToken);
    setSellAmount(buyAmount);
    setBuyAmount(sellAmount);
  };

  const fetchTokens = useCallback(async () => {
    const fetchedTokens = await fetchTokenList(chainId);
    setTokens(fetchedTokens);
  }, [chainId]);

  const fetchSolanaTokens = useCallback(async () => {
    try {
      const response = await axios.get('https://tokens.jup.ag/tokens?tags=verified');
      setSolanaTokens(response.data);
    } catch (error) {
      console.error('Error fetching Solana tokens:', error);
    }
  }, []);

  useEffect(() => {
    if (activeChain === 'ethereum') {
      fetchTokens();
    } else {
      fetchSolanaTokens();
    }
  }, [activeChain, fetchTokens, fetchSolanaTokens]);

  const openTokenSelectModal = (type: 'sell' | 'buy') => {
    setSelectingTokenFor(type);
    setIsTokenSelectModalOpen(true);
  };

  const closeTokenSelectModal = () => {
    setIsTokenSelectModalOpen(false);
    setSelectingTokenFor(null);
  };

  const handleTokenSelect = (token: Token | SolanaToken) => {
    if (selectingTokenFor === 'sell') {
      setSellToken(token);
    } else if (selectingTokenFor === 'buy') {
      setBuyToken(token);
    }
    closeTokenSelectModal();
  };

  const renderTokenSelector = (token: Token | SolanaToken | null, onClick: () => void) => (
    <div className="flex items-center justify-between bg-gray-800 rounded-full px-4 py-2 cursor-pointer" onClick={onClick}>
      {token ? (
        <>
          <div className="flex items-center">
            <TokenImage
              src={token.logoURI}
              alt={token.name}
              width={24}
              height={24}
              className="rounded-full"
            />
            <span className="text-white font-semibold">{token.symbol}</span>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </>
      ) : (
        <span className="text-gray-400">Select token</span>
      )}
    </div>
  );

  const chainOptions = [
    { id: mainnet.id, name: 'Ethereum' },
    { id: polygon.id, name: 'Polygon' },
    { id: optimism.id, name: 'Optimism' },
    { id: arbitrum.id, name: 'Arbitrum' },
    { id: base.id, name: 'Base' },
    { id: avalanche.id, name: 'Avalanche' },
    { id: bsc.id, name: 'BSC' },
    { id: linea.id, name: 'Linea' },
    { id: mantle.id, name: 'Mantle' },
    { id: scroll.id, name: 'Scroll' },
  ];

  const renderChainSelector = () => (
    <select
      value={chainId}
      onChange={(e) => setChainId(Number(e.target.value))}
      className="bg-gray-800 text-white rounded-md p-2"
    >
      {chainOptions.map((chain) => (
        <option key={chain.id} value={chain.id}>
          {chain.name}
        </option>
      ))}
    </select>
  );

  const renderEthereumSwapInterface = () => {
    const isSwapDisabled = !isConnected || !sellToken || !buyToken || !sellAmount || isSwapPending || isSwapLoading;
    console.log('Swap button disabled:', isSwapDisabled);

    return (
      <div className="bg-gray-900 rounded-lg p-4">
        <div className="mb-4">
          <ConnectButton />
        </div>
        <div className="mb-4">
          {renderChainSelector()}
        </div>

        <div className="mb-4">
          <div className="flex justify-between mb-2">
            <span className="text-gray-400">Sell</span>
          </div>
          <div className="flex items-center bg-gray-800 rounded-lg p-3">
            <input
              type="number"
              value={sellAmount}
              onChange={(e) => setSellAmount(e.target.value)}
              className="bg-transparent text-white text-2xl w-full outline-none"
              placeholder="0"
            />
            {renderTokenSelector(sellToken, () => openTokenSelectModal('sell'))}
          </div>
        </div>
        <div className="flex justify-center mb-4">
          <div className="bg-gray-800 p-2 rounded-full cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
        <div className="mb-4">
          <div className="flex justify-between mb-2">
            <span className="text-gray-400">Buy</span>
          </div>
          <div className="flex items-center bg-gray-800 rounded-lg p-3">
            <input
              type="number"
              value={buyAmount}
              onChange={(e) => setBuyAmount(e.target.value)}
              className="bg-transparent text-white text-2xl w-full outline-none"
              placeholder="0"
              readOnly
            />
            {renderTokenSelector(buyToken, () => openTokenSelectModal('buy'))}
          </div>
        </div>
        <div className="flex justify-center">
          <button
            onClick={handleSwap}
            disabled={isSwapDisabled}
            className="py-3 px-4 bg-pink-500 text-white rounded-lg font-semibold disabled:bg-gray-600 disabled:cursor-not-allowed w-2/3"
          >
            {!isConnected ? 'Connect Wallet' : isSwapPending ? 'Confirm in Wallet...' : isSwapLoading ? 'Swapping...' : 'Swap'}
          </button>
        </div>
        {isSwapSuccess && <div className="mt-2 text-center text-green-500">Swap successful!</div>}
        {swapError && <div className="mt-2 text-center text-red-500">Swap failed: {swapError}</div>}
      </div>
    );
  };

  const renderSolanaSwapInterface = () => {
    const isSolanaSwapDisabled = !solanaWallet.connected || !sellToken || !buyToken || !sellAmount;

    return (
      <div className="bg-gray-900 rounded-lg p-4">
        <div className="mb-4">
          <WalletButton />
        </div>

        <div className="mb-4">
          <div className="flex justify-between mb-2">
            <span className="text-gray-400">Sell</span>
          </div>
          <div className="flex items-center bg-gray-800 rounded-lg p-3">
            <input
              type="number"
              value={sellAmount}
              onChange={(e) => setSellAmount(e.target.value)}
              className="bg-transparent text-white text-2xl w-full outline-none"
              placeholder="0"
            />
            {renderTokenSelector(sellToken, () => openTokenSelectModal('sell'))}
          </div>
        </div>
        <div className="flex justify-center mb-4">
          <div className="bg-gray-800 p-2 rounded-full cursor-pointer">
            <ArrowUpDown className="h-6 w-6 text-gray-400" />
          </div>
        </div>
        <div className="mb-4">
          <div className="flex justify-between mb-2">
            <span className="text-gray-400">Buy</span>
          </div>
          <div className="flex items-center bg-gray-800 rounded-lg p-3">
            <input
              type="number"
              value={buyAmount}
              onChange={(e) => setBuyAmount(e.target.value)}
              className="bg-transparent text-white text-2xl w-full outline-none"
              placeholder="0"
              readOnly
            />
            {renderTokenSelector(buyToken, () => openTokenSelectModal('buy'))}
          </div>
        </div>
        <div className="flex justify-center">
          <button
            onClick={() => {/* Implement Solana swap logic */}}
            disabled={isSolanaSwapDisabled}
            className="py-3 px-4 bg-purple-500 text-white rounded-lg font-semibold disabled:bg-gray-600 disabled:cursor-not-allowed w-2/3"
          >
            {!solanaWallet.connected ? 'Connect Wallet' : 'Swap'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col w-full max-w-[1400px] mx-auto justify-center">
      <div className="w-full mb-4">
        <ChainToggle activeChain={activeChain} setActiveChain={setActiveChain} />
      </div>
      <div className="flex flex-col xl:flex-row gap-2 w-full">
        <div className="w-full xl:w-[58%] bg-gray-800 rounded-lg overflow-hidden" style={{ height: '550px' }}>
          <TokenChart ref={chartRef} />
        </div>
        <div className="w-full xl:w-[42%] flex flex-col">
          {activeChain === 'ethereum' ? (
            <div className="flex-grow bg-gray-900 rounded-lg">
              {renderEthereumSwapInterface()}
            </div>
          ) : (
            <div className="flex-grow bg-gray-900 rounded-lg">
              {renderSolanaSwapInterface()}
            </div>
          )}
        </div>
        {isTokenSelectModalOpen && (
          <TokenSelectModal
            tokens={activeChain === 'ethereum' ? tokens : solanaTokens}
            onClose={closeTokenSelectModal}
            onSelect={handleTokenSelect}
          />
        )}
      </div>
    </div>
  );
}

function TokenInput({ label, amount, setAmount, token, openModal, readOnly = false }: {
  label: string;
  amount: string;
  setAmount: (amount: string) => void;
  token: Token | null;
  openModal: () => void;
  readOnly?: boolean;
}) {
  const [usdValue, setUsdValue] = useState<string>("0.00");

  useEffect(() => {
    const calculateUsdValue = async () => {
      if (token && amount && parseFloat(amount) > 0) {
        try {
          const tokenPrice = await fetchTokenPrice(token.address);
          const calculatedValue = parseFloat(amount) * tokenPrice;
          setUsdValue(calculatedValue.toFixed(2));
        } catch (error) {
          console.error("Error calculating USD value:", error);
          setUsdValue("0.00");
        }
      } else {
        setUsdValue("0.00");
      }
    };

    calculateUsdValue();
  }, [token, amount]);

  return (
    <div className="p-4 rounded-md bg-gray-700">
      <div className="flex justify-between items-center mb-2">
        <span className="text-gray-400 text-sm">{label}</span>
      </div>
      <div className="flex justify-between items-center">
        <input
          type="text"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="bg-transparent text-2xl font-semibold outline-none w-1/2"
          readOnly={readOnly}
          placeholder="0"
        />
        <button
          onClick={openModal}
          className="flex items-center space-x-2 bg-gray-600 rounded-md py-2 px-4 hover:bg-gray-500 transition-colors"
        >
          {token?.logoURI && (
            <div className="w-6 h-6 relative">
              <Image
                src={token.logoURI}
                alt={token.name}
                layout="fill"
                objectFit="cover"
                className="rounded-full"
              />
            </div>
          )}
          <span className="text-sm font-medium">{token?.symbol}</span>
          <ChevronDown className="text-gray-400 w-4 h-4" />
        </button>
      </div>
      <div className="text-gray-400 text-sm mt-2">
        ${usdValue}
      </div>
    </div>
  );
}