'use client';

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { ChevronDown, ArrowUpDown, Search, X, ArrowUp } from "lucide-react";
import Image from "next/image";
import { 
  useAccount, 
  useBalance, 
  useChainId, 
  useConnect, 
  useDisconnect, 
  useContractRead, 
  useWaitForTransactionReceipt, 
  useConfig, 
  useWriteContract, 
  useEstimateGas, 
  useSignTypedData, 
  useSendTransaction, 
  usePublicClient, 
  useWalletClient
} from 'wagmi';
import { useSimulateContract } from 'wagmi';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { formatUnits, parseUnits, encodeFunctionData, toHex, getContract, concat, numberToHex, size, Hex } from "viem";
import { Address } from 'viem';
import { MAINNET_TOKENS, MAX_ALLOWANCE, MAINNET_EXCHANGE_PROXY } from "../../src/constants";
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import TokenChart, { TokenChartRef } from './TokenChart';
import TokenSelector from '../token-list/TokenSelector';
import { fetchTokenList, TokenInfo } from '../../lib/fetchTokenList';
import { fetchTokenPrice } from '../utils/priceUtils';
import { EXCHANGE_PROXY_ABI, EXCHANGE_PROXY_ADDRESSES, ERC20_ABI, MAINNET_TOKENS_BY_SYMBOL, ETH_ADDRESS, API_SWAP_PRICE_URL, FEE_RECIPIENT, AFFILIATE_FEE, NATIVE_SOL_MINT, WRAPPED_SOL_MINT, JUPITER_QUOTE_API_URL, JUPITER_SWAP_API_URL, SOLANA_DEFAULT_SLIPPAGE_BPS, SOL_MINT_ADDRESSES } from '@app/constants';
import TokenSelectModal from '@/app/components/TokenSelectModal';
import { simulateContract, waitForTransactionReceipt, readContract } from 'wagmi/actions';
import ChainToggle from './ChainToggle';
import MainTrading from './ChainToggle';
import { WalletButton } from './WalletButton';
import TokenImage from './TokenImage';
import { mainnet, polygon, optimism, arbitrum, base, avalanche, bsc, linea, mantle, scroll } from 'wagmi/chains';
import { fetchJupiterQuote, getInputMint, getOutputMint } from '@/app/utils/jupiterApi';
import { Connection, sendAndConfirmTransaction, PublicKey, Transaction, VersionedTransaction, 
  TransactionInstruction, Commitment, AddressLookupTableProgram, TransactionMessage, 
  AddressLookupTableAccount, ConnectionConfig, VersionedMessage, Keypair } from '@solana/web3.js';
import { getConnection, sendAndConfirmTransactionWithRetry, getWebSocketEndpoint } from '../utils/solanaUtils';
import { SOLANA_RPC_ENDPOINTS } from '@app/constants';
import { Token as SPLToken, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import BigNumber from 'bignumber.js';
import { SOLANA_TOKENS_BY_SYMBOL } from '../constants';
import { retry } from '@/app/utils/retry';
import TokenInput from './TokenInput';
import { formatDisplayAmount } from '../utils/formatAmount';
import { formatTokenAmount } from '@/app/utils/formatAmount';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { DEFAULT_SLIPPAGE_BPS } from '../constants';
import { debounce } from 'lodash';
import SwapConfirmationModal from './SwapConfirmationModal';
import { WalletContextState } from '@solana/wallet-adapter-react';
import { ComputeBudgetProgram } from '@solana/web3.js';
import fetch from 'cross-fetch';
import { solanaWebSocket, subscribeToTransaction } from '../utils/solanaWebSocket';
import { fetchJupiterSwapInstructions } from '../utils/jupiterApi';
import { ethers } from 'ethers';
import EthSlippageSettings from './EthSlippageSettings';
import { ETH_DEFAULT_SLIPPAGE_PERCENTAGE } from '@app/constants';
import { PERMIT2_ADDRESS } from '@app/constants';
import { WETH_ADDRESS } from '@app/constants';
import { permit2Abi } from '@/src/utils/permit2abi'; // Update this import path
import { fetchAvalanchePrice, fetchAvalancheQuote } from '../utils/avalancheUtils';
import { AVALANCHE_CHAIN_ID, AVALANCHE_TOKENS, JOE_TOKEN_ADDRESS, NATIVE_TOKEN_ADDRESS } from '../constants';
import { MaxUint256 } from 'ethers';
import { fetchArbitrumTokens } from '../utils/arbitrumUtils';
import { fetchPolygonTokens } from '../utils/polygonUtils';
import { fetchOptimismTokens } from '../utils/optimismUtils';
import { ARBITRUM_CHAIN_ID, POLYGON_CHAIN_ID, OPTIMISM_CHAIN_ID, ETHEREUM_CHAIN_ID } from '@app/constants';
import { fetchAvalancheTokens } from '../utils/avalancheUtils';
import EthereumConfirmationModal from './EthereumConfirmationModal';
import { calculatePriceImpact, formatGasEstimate } from '../utils/ethereumUtils';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { fetchJupiterPrice, getCachedJupiterPrice } from '../utils/jupiterPriceUtils';
import SolanaSlippageSettings from './SolanaSlippageSettings';
import ChainSelector from './ChainSelector';
import type { PublicClient, WalletClient } from 'viem';
import type { Chain } from 'viem';
import { ConnectButton, type ConnectButtonProps } from '@rainbow-me/rainbowkit';


// Update these color utility classes
const darkThemeClasses = {
  primary: 'bg-gray-900', // Match the token chart background
  secondary: 'bg-gray-800', // Keep existing secondary color
  accent: 'bg-gray-800', // Match secondary for consistency
  hover: 'hover:bg-gray-700', // Lighter hover state
};

// Add this ERC20 ABI constant
const erc20Abi = [
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" }
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  }
] as const;

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

interface TokenData extends TokenInfo {
  address: `0x${string}` | string; // Allow both Ethereum and Solana addresses
  chainId?: number;
  _timestamp?: number;
  logoURI: string;
  symbol: string;
  decimals: number;
  name: string;
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

// Add this interface after the TokenData and SolanaToken interfaces
interface QuoteResponse {
  buyAmount: string;
  transaction: {
    to: string;
    data: string;
    value: string;
    gas?: string;
    gasPrice?: string;
  };
  permit2?: {
    eip712: {
      types: {
        [key: string]: Array<{ name: string; type: string }>;
      };
      primaryType: string; // Add this required field
      domain: {
        name: string;
        version: string;
        chainId: number;
        verifyingContract: `0x${string}`; // Update this type
      };
      message: Record<string, any>;
    };
  };
  allowanceTarget?: string;
  price?: string;
  guaranteedPrice?: string;
  estimatedPriceImpact?: string;
  minimumBuyAmount?: string;
  grossBuyAmount?: string;
  expectedSlippage?: string;
  sources?: Array<{
    name: string;
    proportion: string;
  }>;
}

const checkBalance = async (solanaWallet: any) => {
  if (!solanaWallet.publicKey) {
    throw new Error('Wallet not connected');
  }
  const connection = getConnection();
  const balance = await connection.getBalance(solanaWallet.publicKey);
  const minimumBalance = 0.01 * LAMPORTS_PER_SOL; // 0.01 SOL for fees
  if (balance < minimumBalance) {
    throw new Error('Insufficient SOL balance for transaction fees');
  }
};

// Add this function at the top of your component
const isTransactionValid = (transaction: VersionedTransaction) => {
  if (!transaction.message || !transaction.message.recentBlockhash) {
    console.error('Invalid transaction: missing message or recentBlockhash');
    return false;
  }
  if (transaction.message.compiledInstructions.length === 0) {
    console.error('Invalid transaction: no instructions');
    return false;
  }
  return true;
};

// Add this at the top level, before the component definition
const formatUsdValue = (amount: string | number, price: number) => {
  if (!amount || !price) return '$0.00';
  
  // Convert amount to number and remove commas if it's a string
  const numericAmount = typeof amount === 'string' ? 
    parseFloat(amount.replace(/,/g, '')) : amount;
  
  if (isNaN(numericAmount)) return '$0.00';
  
  const value = numericAmount * price;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

// Add this at the top level, outside the component
const priceCache = new Map<string, { price: number; timestamp: number }>();
const CACHE_DURATION = 60000; // 1 minute cache duration

// Add this helper function
const getCachedPrice = (tokenAddress: string): number | null => {
  const cached = priceCache.get(tokenAddress);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.price;
  }
  return null;
};

// First, update the type definition for the hook
const useSolanaTokenBalance = (
  token: (TokenData | SolanaToken | null),
  publicKey: PublicKey | null,
  connection: Connection | null
): number | null => {
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!token || !publicKey || !connection) return;

    const fetchBalance = async () => {
      try {
        // Check if it's SOL
        if (SOL_MINT_ADDRESSES.includes(token.address)) {
          const solBalance = await connection.getBalance(publicKey);
          setBalance(solBalance / LAMPORTS_PER_SOL);
        } else {
          const tokenMint = new PublicKey(token.address);
          const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
            mint: tokenMint
          });

          if (tokenAccounts.value[0]) {
            setBalance(tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount);
          } else {
            setBalance(0);
          }
        }
      } catch (error) {
        console.error('Error fetching token balance:', error);
        setBalance(0);
      }
    };

    fetchBalance();
    const interval = setInterval(fetchBalance, 30000);
    return () => clearInterval(interval);
  }, [token, publicKey, connection]);

  return balance;
};

export default function UnifiedSwapInterface({ activeChain, setActiveChain }: {
  activeChain: 'ethereum' | 'solana';
  setActiveChain: (chain: 'ethereum' | 'solana') => void;
}) {
  // State declarations must be at the top level of your component
  const [isLoadingTokens, setIsLoadingTokens] = useState<boolean>(false);
  const [showTokenSelect, setShowTokenSelect] = useState<boolean>(false);
  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [solanaTokens, setSolanaTokens] = useState<TokenData[]>([]);
  const [selectedFromToken, setSelectedFromToken] = useState<TokenData | null>(null);
  const [selectedToToken, setSelectedToToken] = useState<TokenData | null>(null);

  // Use the regular HTTP connection with custom fetch
  const connection = useMemo(() => {
    return new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_BASE as string, {
      commitment: 'confirmed',
      fetch: async (url, options) => {
        try {
          const response = await fetch('/api/solana-rpc', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: options?.body,
          });
          return response;
        } catch (error) {
          console.error('RPC request failed:', error);
          throw error;
        }
      },
    });
  }, []);
  
  // Get the WebSocket endpoint
  const wsEndpoint = getWebSocketEndpoint();

  // State declarations
  const [sellToken, setSellToken] = useState<TokenData | SolanaToken | null>(null);
  const [buyToken, setBuyToken] = useState<TokenData | SolanaToken | null>(null);
  const [sellAmount, setSellAmount] = useState<string>('');
  const [buyAmount, setBuyAmount] = useState<string>('0');
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
  const { data: walletClient } = useWalletClient();

  // Solana wallet
  const solanaWallet = useWallet();

  // Move checkWalletReady inside the component
  const checkWalletReady = () => {
    if (!solanaWallet.connected) {
      throw new Error('Wallet is not connected');
    }
    if (!solanaWallet.publicKey) {
      throw new Error('Wallet public key is not available');
    }
    if (!solanaWallet.signTransaction) {
      throw new Error('Wallet does not support transaction signing');
    }
  };

  const exchangeProxyAddress = EXCHANGE_PROXY_ADDRESSES[chainId];

  const [tokenAllowances, setTokenAllowances] = useState<{[address: string]: bigint}>({});

  // Update the useContractRead hook and remove refetchAllowance
  const { data: allowance } = useContractRead({
    address: sellToken?.address as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: sellToken && address ? [address as `0x${string}`, exchangeProxyAddress] : undefined,
    query: {
      enabled: Boolean(sellToken && address)
    }
  });

  useEffect(() => {
    if (sellToken && allowance !== undefined) {
      setTokenAllowances(prev => ({
        ...prev,
        [sellToken.address]: allowance as bigint
      }));
    }
  }, [sellToken, allowance]);

  const isApprovalNeeded = useCallback(() => {
    if (!sellToken || !sellAmount) return false;
    const currentAllowance = tokenAllowances[sellToken.address] || BigInt(0);
    const requiredAllowance = parseUnits(sellAmount, sellToken.decimals);
    return currentAllowance < requiredAllowance;
  }, [sellToken, sellAmount, tokenAllowances]);

  // Update the hooks at the top of the component
  const { writeContract, data: approveData } = useWriteContract();

  // Update the transaction receipt hooks
  const { isLoading: isApproving, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt(
    approveData ? {
      hash: approveData as `0x${string}`,
      confirmations: 1
    } : {
      hash: undefined,
      confirmations: 1
    }
  );

  // Remove the duplicate writeContract declaration
  // const { data: swapData } = useWriteContract();
  // Instead, use a separate hook for swap transactions
  const { writeContract: writeSwapContract, data: swapData } = useWriteContract();

  // Move this up before using isSwapSuccess
  const { isSuccess: isSwapSuccess } = useWaitForTransactionReceipt(
    swapData ? {
      hash: swapData as `0x${string}`,
      confirmations: 1
    } : {
      hash: undefined,
      confirmations: 1
    }
  );

  // Now we can use isSwapSuccess since it's declared
  const isSwapPending = Boolean(swapData && !isSwapSuccess);

  // Update the approval success effect
  useEffect(() => {
    if (isApproveSuccess) {
      setApprovalState('approved');
      // Remove refetchAllowance call since we're using the query system
    }
  }, [isApproveSuccess]);

  // Update the approval check in useEffect
  useEffect(() => {
    if (sellToken && sellAmount && allowance !== undefined && exchangeProxyAddress) {
      const sellAmountBigInt = parseUnits(sellAmount, sellToken.decimals);
      if (allowance && sellAmountBigInt > (allowance as bigint)) {
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

  const handleApprove = async () => {
    if (!walletClient || !sellToken || !address || !publicClient) {
      console.error('Missing required parameters for approval');
      return;
    }

    try {
      console.log('Approving token:', sellToken.address, 'for spender:', PERMIT2_ADDRESS);
      
      const tokenContract = {
        address: sellToken.address as `0x${string}`,
        abi: ERC20_ABI,
      };

      // First check current allowance with type assertion
      const currentAllowance = await publicClient.readContract({
        ...tokenContract,
        functionName: 'allowance',
        args: [
          address as `0x${string}`, 
          PERMIT2_ADDRESS as `0x${string}`
        ]
      }) as bigint;

      if (currentAllowance > 0n) {
        console.log('Token already has allowance:', currentAllowance.toString());
        setNeedsAllowance(false);
        return;
      }

      // Send approval transaction
      const { request } = await publicClient.simulateContract({
        ...tokenContract,
        functionName: 'approve',
        args: [PERMIT2_ADDRESS as `0x${string}`, MAX_ALLOWANCE],
        account: address
      });

      await writeContract(request);

      // Wait for the transaction hash from the hook data
      if (!approveData) {
        throw new Error('No transaction hash received');
      }

      // Wait for confirmation
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: approveData,
        confirmations: 1
      });

      if (receipt.status === 'reverted') {
        throw new Error('Transaction reverted');
      }

      console.log('Transaction confirmed:', receipt);
      setNeedsAllowance(false);
      
      // Refetch quote after approval
      await updateBuyAmount();

    } catch (error) {
      console.error('Error approving token:', error);
      throw new Error('Failed to approve token: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const [swapError, setSwapError] = useState<string | null>(null);

  const [ethSlippage, setEthSlippage] = useState(ETH_DEFAULT_SLIPPAGE_PERCENTAGE);

  // Add quote state
  const [quote, setQuote] = useState<any>(null);
  
  // Add this function to check and handle approvals
  const checkAndApproveToken = async (
    tokenAddress: `0x${string}`,
    spenderAddress: `0x${string}`,
    amount: bigint
  ) => {
    try {
      if (!publicClient) {
        throw new Error('Public client not available');
      }

      if (!address) {
        throw new Error('No address available');
      }

      console.log('Checking approval for:', {
        tokenAddress,
        spenderAddress,
        amount: amount.toString()
      });

      const tokenContract = {
        address: tokenAddress,
        abi: erc20Abi,
      };

      // Check current allowance
      const currentAllowance = await publicClient.readContract({
        ...tokenContract,
        functionName: 'allowance',
        args: [address as `0x${string}`, spenderAddress],
      });

      console.log('Current allowance:', currentAllowance.toString());

      if (currentAllowance < amount) {
        console.log('Approval needed. Requesting approval for:', amount.toString());
        
        // Add null check for walletClient
        if (!walletClient) {
          throw new Error('Wallet client not available');
        }

        const { request } = await publicClient.simulateContract({
          ...tokenContract,
          functionName: 'approve',
          args: [spenderAddress, MaxUint256], // Use max approval
          account: address,
        });

        const hash = await walletClient.writeContract(request) as `0x${string}`;
        console.log('Approval transaction submitted:', hash);

        const receipt = await publicClient.waitForTransactionReceipt({
          hash,
          confirmations: 1
        });

        if (receipt.status === 'reverted') {
          throw new Error('Transaction reverted');
        }

        console.log('Transaction confirmed:', receipt);
        return true;
      }

      console.log('Token already approved');
      return true;
    } catch (error) {
      console.error('Approval error:', error);
      throw new Error(`Failed to approve token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Update the fetchQuote function
  const fetchQuote = useCallback(async (): Promise<QuoteResponse> => {
    if (!sellToken || !buyToken || !sellAmount || !address) {
      throw new Error('Missing required parameters for quote');
    }

    const sellAmountInBaseUnits = parseUnits(
      sellAmount, 
      sellToken.decimals
    ).toString();

    const sellTokenAddress = sellToken.address.toLowerCase() === ETH_ADDRESS.toLowerCase() ? 
      'ETH' : sellToken.address;
    const buyTokenAddress = buyToken.address.toLowerCase() === ETH_ADDRESS.toLowerCase() ? 
      'ETH' : buyToken.address;

    const params = {
      chainId,
      sellToken: sellTokenAddress,
      buyToken: buyTokenAddress,
      sellAmount: sellAmountInBaseUnits,
      takerAddress: address,
      slippagePercentage: ethSlippage.toString()
    };

    const response = await axios.get<QuoteResponse>('/api/swap-price', { params });
    return response.data;
  }, [sellToken, buyToken, sellAmount, address, ethSlippage, chainId]);

  // Add this function to check and set allowance
  const checkAndSetAllowance = async (
    sellToken: TokenData,
    sellAmount: bigint,
    address: `0x${string}`,
    walletClient: WalletClient,
    client: any
  ) => {
    if (!isPublicClientAvailable(client)) {
      throw new Error('Public client not available');
    }

    try {
      console.log('Checking allowance...', {
        sellToken,
        sellAmount: sellAmount.toString(),
        address,
        permit2Address: PERMIT2_ADDRESS
      });

      // Skip allowance check for native token (ETH/AVAX/etc)
      if (sellToken.address.toLowerCase() === ETH_ADDRESS.toLowerCase()) {
        console.log('Native token detected, skipping allowance check');
        return true;
      }

      // Check current allowance using readContract
      const currentAllowance = (await readContract(config, {
        address: sellToken.address as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [address as `0x${string}`, PERMIT2_ADDRESS as `0x${string}`],
      })) as bigint;

      console.log('Current allowance:', currentAllowance.toString());
      console.log('Required amount:', sellAmount.toString());

      // If allowance is insufficient, request approval
      if (currentAllowance < sellAmount) {
        console.log('Insufficient allowance, requesting approval...');

        try {
          // Simulate the approval transaction
          const { request } = await client.simulateContract({
            address: sellToken.address as `0x${string}`,
            abi: ERC20_ABI,
            functionName: 'approve',
            args: [PERMIT2_ADDRESS as `0x${string}`, MAX_ALLOWANCE],
            account: address
          });

          console.log('Approval simulation successful, sending transaction...');

          if (!publicClient) {
            throw new Error('Public client not available');
          }

          // Send the approval transaction
          const hash = await walletClient.writeContract(request);
          const txHash = hash as `0x${string}`;
          console.log('Approval transaction submitted:', txHash);

          // Wait for transaction confirmation
          const receipt = await publicClient.waitForTransactionReceipt({
            hash: txHash,
            confirmations: 1
          });

          if (receipt.status === 'reverted') {
            throw new Error('Transaction reverted');
          }

          console.log('Transaction confirmed:', receipt);
          return true;
        } catch (error) {
          console.error('Error in approval transaction:', error);
          throw new Error(`Approval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      console.log('Sufficient allowance already exists');
      return true;
    } catch (error) {
      console.error('Error in allowance check/approval:', error);
      throw new Error(`Failed to approve token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Add this state for transaction tracking
  const [pendingTxSignature, setPendingTxSignature] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<'pending' | 'success' | 'error' | null>(null);

  // Update your handleSwap function
  const handleSwap = async () => {
    try {
      const quote = await fetchQuote();
      console.log('Raw quote response:', quote);

      if (!quote?.transaction?.to || !quote?.transaction?.data) {
        throw new Error('Invalid quote response - missing transaction details');
      }

      let txData = quote.transaction.data as `0x${string}`;

      if (quote.permit2?.eip712) {
        console.log('Signing permit2 data...');
        const signature = await signTypedDataAsync(quote.permit2.eip712);
        
        const MAGIC_CALLDATA_STRING = "f".repeat(130);
        if (txData.includes(MAGIC_CALLDATA_STRING)) {
          // Replace the magic string with the signature
          txData = txData.replace(
            MAGIC_CALLDATA_STRING, 
            signature.slice(2)
          ) as `0x${string}`;
        } else {
          // Append signature length and signature
          const signatureLengthInHex = numberToHex(size(signature), {
            signed: false,
            size: 32,
          });
          txData = concat([
            txData, 
            signatureLengthInHex, 
            signature
          ]) as `0x${string}`;
        }
      }

      // Format transaction parameters
      const txParams = {
        to: quote.transaction.to as `0x${string}`,
        data: txData.startsWith('0x') ? txData as `0x${string}` : `0x${txData}` as `0x${string}`,
        value: BigInt(quote.transaction.value || '0'),
        chainId: Number(chainId),
        gas: quote.transaction.gas ? BigInt(quote.transaction.gas) : undefined,
        gasPrice: quote.transaction.gasPrice ? BigInt(quote.transaction.gasPrice) : undefined,
        meta: {
          title: 'Swap via 0x',
          description: sellToken && buyToken 
            ? `Swap ${sellAmount} ${sellToken.symbol} for ~${
                formatUnits(BigInt(quote.buyAmount), buyToken.decimals)
              } ${buyToken.symbol}`
            : 'Swap tokens',
          tokens: sellToken && buyToken ? [
            {
              address: sellToken.address,
              symbol: sellToken.symbol,
              decimals: sellToken.decimals,
              amount: sellAmount
            },
            {
              address: buyToken.address,
              symbol: buyToken.symbol,
              decimals: buyToken.decimals,
              amount: quote.buyAmount
            }
          ] : []
        }
      };

      console.log('Sending transaction with params:', txParams);

      const tx = await sendTransactionAsync(txParams);
      console.log('Transaction submitted:', tx);

      // After sending transaction
      const signature = '4XSRDf98HiifJSSZzBtDgx58swkrJKTv597dxp9wcjQms28sBWbsCk7Z8C3Dfn84A5gWAiXZ2CgzgFW5vxiYPJs9';
      console.log('Transaction sent:', signature);
      
      setPendingTxSignature(signature);
      setTxStatus('pending');

      // Subscribe to transaction status via WebSocket
      solanaWebSocket.subscribeToTransaction(signature, {
        onStatusChange: (status) => {
          console.log('Transaction status update:', status);
          setTxStatus(status);
        },
        onFinality: (success) => {
          console.log('Transaction finalized:', success ? 'success' : 'error');
          setTxStatus(success ? 'success' : 'error');
          setPendingTxSignature(null);
        }
      });

    } catch (error) {
      console.error('Swap error:', error);
      setTxStatus('error');
      setPendingTxSignature(null);
    }
  };

  // Add useEffect to cleanup WebSocket subscription
  useEffect(() => {
    let isSubscribed = true;
    let cleanupFn: (() => void) | undefined;
    
    if (pendingTxSignature) {
      // Create the subscription
      solanaWebSocket.subscribeToTransaction(pendingTxSignature, {
        onStatusChange: (status) => {
          if (isSubscribed) {
            console.log('Transaction status:', status);
            setTxStatus(status);
          }
        },
        onFinality: (success) => {
          if (isSubscribed) {
            console.log('Transaction finality:', success);
            if (success) {
              setTxStatus('success');
            } else {
              setTxStatus('error');
            }
          }
        }
      }).then(subscription => {
        if (isSubscribed) {
          cleanupFn = () => {
            // Cleanup subscription
            solanaWebSocket.subscribeToTransaction(pendingTxSignature, {
              onStatusChange: () => {},
              onFinality: () => {}
            });
          };
        }
      }).catch(error => {
        console.error('Error subscribing to transaction:', error);
      });
    }

    // Return cleanup function
    return () => {
      isSubscribed = false;
      if (cleanupFn) {
        cleanupFn();
      }
    };
  }, [pendingTxSignature]);

  // Add this helper function to properly format token addresses for Avalanche
  const getProperTokenAddress = (token: TokenData | null, chainId: number) => {
    if (!token) return null;
    
    // Handle native AVAX
    if (chainId === AVALANCHE_CHAIN_ID && token.address.toLowerCase() === ETH_ADDRESS.toLowerCase()) {
      return NATIVE_TOKEN_ADDRESS;
    }
    
    return token.address;
  };

  // Add this new function to handle WETH approval
  const handleWETHApproval = async (amount: bigint) => {
    if (!walletClient || !address || !publicClient) return;

    try {
      const { request } = await publicClient.simulateContract({
        address: WETH_ADDRESS as `0x${string}`,
        abi: erc20Abi,
        functionName: 'approve',
        args: [PERMIT2_ADDRESS as `0x${string}`, MAX_ALLOWANCE],
        account: address,
      });

      const hash = await walletClient.writeContract(request);
      await publicClient.waitForTransactionReceipt({ 
        hash: hash as `0x${string}`,
        confirmations: 1
      });
      
      console.log('WETH approval successful');
    } catch (error) {
      console.error('WETH approval failed:', error);
      throw new Error('WETH approval failed');
    }
  };

  const swapTokens = () => {
    setSellToken(buyToken);
    setBuyToken(sellToken);
    setSellAmount(buyAmount);
    setBuyAmount(sellAmount);
  };

  const [availableTokens, setAvailableTokens] = useState<TokenData[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedToken, setSelectedToken] = useState<TokenData | null>(null);

  const fetchTokensForChain = useCallback(async () => {
    if (!chainId) return;

    try {
      console.log('Fetching tokens for chain ID:', chainId);
      let tokens: TokenData[] = [];

      switch (chainId) {
        case ARBITRUM_CHAIN_ID:
          tokens = await fetchArbitrumTokens();
          console.log('Fetched Arbitrum tokens:', tokens.length);
          break;
        case POLYGON_CHAIN_ID:
          tokens = await fetchPolygonTokens();
          console.log('Fetched Polygon tokens:', tokens.length);
          break;
        case OPTIMISM_CHAIN_ID:
          tokens = await fetchOptimismTokens();
          console.log('Fetched Optimism tokens:', tokens.length);
          break;
        case AVALANCHE_CHAIN_ID:
          tokens = await fetchAvalancheTokens();
          console.log('Fetched Avalanche tokens:', tokens.length);
          break;
        default:
          console.log('Using default Ethereum tokens');
          const fetchedTokens = await fetchTokenList(chainId);
          tokens = fetchedTokens.map(token => ({
            ...token,
            address: token.address.toLowerCase().startsWith('0x') 
              ? (token.address as `0x${string}`) 
              : (`0x${token.address}` as `0x${string}`),
            chainId,
            logoURI: token.logoURI || '',
            _timestamp: Date.now()
          }));
      }

      if (tokens && Array.isArray(tokens)) {
        const validTokens = tokens
          .filter(token => token.address && token.symbol && token.name)
          .filter((token, index, self) => 
            index === self.findIndex(t => t.address.toLowerCase() === token.address.toLowerCase())
          );

        console.log(`Setting ${validTokens.length} valid tokens for chain ${chainId}`);
        setTokens(validTokens);
      }
    } catch (error) {
      console.error(`Error fetching tokens for chain ${chainId}:`, error);
      setTokens([]);
    }
  }, [chainId]);

  useEffect(() => {
    fetchTokensForChain();
  }, [fetchTokensForChain, chainId]);

  // Update the fetchSolanaTokens function to return the tokens
  const fetchSolanaTokens = useCallback(async () => {
    try {
      const response = await fetch('https://token.jup.ag/strict');
      const tokens = await response.json();
      
      // Add native SOL to the list
      const tokensList = [{
        address: '11111111111111111111111111111111',
        symbol: 'SOL',
        name: 'Solana',
        decimals: 9,
        logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png'
      }, ...tokens];

      // Set the state
      setSolanaTokens(tokensList);
      
      // Return the tokens array
      return tokensList;
    } catch (error) {
      console.error('Error fetching Solana tokens:', error);
      return [];
    }
  }, []);

  // Update the effect that uses fetchSolanaTokens
  useEffect(() => {
    const loadTokens = async () => {
      setIsLoadingTokens(true);
      try {
        if (activeChain === 'solana') {
          console.log('Fetching Solana tokens...');
          const solanaTokensList = await fetchSolanaTokens();
          console.log('Fetched Solana tokens:', solanaTokensList.length);
          setTokens(solanaTokensList); // Solana tokens don't need transformation
        } else {
          console.log('Fetching EVM tokens...');
          const fetchedTokens = await fetchTokenList(chainId);
          console.log('Fetched EVM tokens:', fetchedTokens.length);
          
          // Transform the tokens to ensure proper typing
          const transformedTokens: TokenData[] = fetchedTokens.map(token => ({
            ...token,
            address: token.address.toLowerCase().startsWith('0x') 
              ? (token.address as `0x${string}`) 
              : (`0x${token.address}` as `0x${string}`),
            chainId,
            logoURI: token.logoURI || '',
            _timestamp: Date.now()
          }));

          setTokens(transformedTokens);
        }
      } catch (error) {
        console.error('Error fetching tokens:', error);
        setError('Failed to fetch tokens');
      } finally {
        setIsLoadingTokens(false);
      }
    };

    loadTokens();
  }, [chainId, activeChain, fetchSolanaTokens]);

  const openTokenSelectModal = (type: 'sell' | 'buy') => {
    setSelectingTokenFor(type);
    setIsTokenSelectModalOpen(true);
  };

  const closeTokenSelectModal = () => {
    setIsTokenSelectModalOpen(false);
    setSelectingTokenFor(null);
  };

  const handleTokenSelect = (token: TokenData) => {
    const selectedToken = {
      ...token,
      logoURI: token.logoURI || '',
      _timestamp: Date.now(),
    };

    if (selectingTokenFor === 'sell') {
      setSellToken(selectedToken);
    } else if (selectingTokenFor === 'buy') {
      setBuyToken(selectedToken);
    }
    
    setIsTokenSelectModalOpen(false);
    setSelectingTokenFor(null);
  };

  // Update the renderTokenSelector function to handle both token types
  const renderTokenSelector = (
    token: TokenData | SolanaToken | null, 
    onClick: () => void
  ) => (
    <button
      onClick={onClick}
      className={`
        flex items-center space-x-2
        bg-[#1a1b1f] 
        rounded-2xl 
        px-4 py-2 
        hover:bg-[#2c2d33]
        transition-colors
        ml-2                   
        flex-shrink-0          
      `}
    >
      {token ? (
        <>
          <div className="w-6 h-6 rounded-full overflow-hidden">
            <TokenImage
              src={token.logoURI}
              alt={token.symbol}
              width={24}
              height={24}
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-white text-sm">{token.symbol}</span>
        </>
      ) : (
        <span className={`text-sm font-bold ${
          activeChain === 'ethereum' 
            ? 'text-[#77be44]' 
            : 'text-[#9333ea]'
        }`}>
          Select Token
        </span>
      )}
    </button>
  );

  const [slippageTolerance, setSlippageTolerance] = useState<number>(300); // Fixed 3% (300 basis points)

  const [swapStatus, setSwapStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [swapMessage, setSwapMessage] = useState<string>('');
  const [inputToken, setInputToken] = useState<string>('');
  const [outputToken, setOutputToken] = useState<string>('');
  const [inputAmount, setInputAmount] = useState<string>('');
  const [quoteResponse, setQuoteResponse] = useState<any>(null);

  const [isLoadingPrice, setIsLoadingPrice] = useState(false);

  // Add this state declaration at the top of the component with other states
  const [currentSlippage, setCurrentSlippage] = useState(0.5);

  // Move these state declarations to the top with other state declarations
  const [ethSlippagePercentage, setEthSlippagePercentage] = useState<number>(0.5);
  const [solanaSlippagePercentage, setSolanaSlippagePercentage] = useState<number>(0.5);

  // Update the slippage handler
  const handleSlippageChange = (newSlippage: number) => {
    console.log('Setting new slippage:', newSlippage, '%');
    if (activeChain === 'ethereum') {
      setEthSlippagePercentage(newSlippage);
    } else {
      setSolanaSlippagePercentage(newSlippage);
    }
    // Trigger a new quote update when slippage changes
    debouncedUpdateBuyAmount();
  };

  // Update the useEffect for price updates
  useEffect(() => {
    const updatePrice = async () => {
      if (!sellToken || !buyToken || !sellAmount || parseFloat(sellAmount) === 0) {
        setBuyAmount('0');
        return;
      }

      try {
        // Separate logic for Solana and Ethereum
        if (activeChain === 'solana') {
          const amountInBaseUnits = Math.floor(
            parseFloat(sellAmount.replace(/,/g, '')) * Math.pow(10, sellToken.decimals)
          ).toString();

          const slippageBps = Math.round(solanaSlippagePercentage * 100);
          console.log('Fetching Jupiter quote with slippage (bps):', slippageBps);

          const quoteResponse = await fetchJupiterQuote({
            inputMint: sellToken.address,
            outputMint: buyToken.address,
            amount: amountInBaseUnits,
            slippageBps,
            maxAccounts: 64
          });

          if (quoteResponse && quoteResponse.outAmount) {
            const formattedBuyAmount = (
              Number(quoteResponse.outAmount) / Math.pow(10, buyToken.decimals)
            ).toString();
            console.log('Setting buy amount from Jupiter:', formattedBuyAmount);
            setBuyAmount(formattedBuyAmount);
            setQuoteResponse(quoteResponse);
          }
          return; // Exit early for Solana
        }

        // Ethereum price fetching logic
        if (activeChain === 'ethereum') {
          const sellTokenAddress = sellToken.address === ETH_ADDRESS ? 
            'ETH' : sellToken.address;
          
          const buyTokenAddress = buyToken.address === ETH_ADDRESS ?
            'ETH' : buyToken.address;

          const response = await axios.get('/api/price', {
            params: {
              chainId,
              sellToken: sellTokenAddress,
              buyToken: buyTokenAddress,
              sellAmount: parseUnits(sellAmount, sellToken.decimals).toString(),
              taker: address,
              slippageBps: Math.round(ethSlippagePercentage * 100)
            }
          });
          
          if (response.data.buyAmount) {
            setBuyAmount(formatUnits(response.data.buyAmount, buyToken.decimals));
          }
        }
      } catch (error) {
        console.error('Error fetching price:', error);
        setBuyAmount('0');
        if (activeChain === 'solana') {
          setSwapMessage('Error fetching Jupiter quote');
        } else {
          setSwapMessage('Error fetching 0x quote');
        }
      }
    };

    // Debounce the price update
    const debouncedUpdate = debounce(updatePrice, 500);
    debouncedUpdate();

    return () => {
      debouncedUpdate.cancel();
    };
  }, [
    sellToken,
    buyToken,
    sellAmount,
    activeChain,
    chainId,
    address,
    ethSlippagePercentage,
    solanaSlippagePercentage
  ]);

  // Remove or comment out the old updateBuyAmount function and its debounced version
  // since we're now handling everything in the useEffect above

  const fetchSwapTransaction = async (quoteResponse: any) => {
    if (!solanaWallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    const response = await fetch('https://quote-api.jup.ag/v6/swap', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        quoteResponse,
        userPublicKey: solanaWallet.publicKey.toString(),
        dynamicComputeUnitLimit: true,
        prioritizationFeeLamports: "auto",
      })
    });
    return await response.json();
  };

  const sendTransactionWithRetry = async (
    connection: Connection, 
    transaction: Transaction, 
    signers: Keypair[], 
    commitment: Commitment = 'confirmed'
  ) => {
    if (!solanaWallet.signTransaction) {
      throw new Error('Wallet does not support transaction signing');
    }
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.lastValidBlockHeight = lastValidBlockHeight;

    const signedTransaction = await solanaWallet.signTransaction(transaction);
    return await connection.sendRawTransaction(signedTransaction.serialize(), {
      skipPreflight: true,
      maxRetries: 3,
    });
  };

  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);

  const handleSwapClick = () => {
    setIsConfirmationModalOpen(true);
  };

  const [transactionStatus, setTransactionStatus] = useState<'idle' | 'pending' | 'success' | 'rejected' | 'error'>('idle');

  const handleConfirmSwap = async () => {
    if (!solanaWallet.connected || !solanaWallet.publicKey) {
      throw new Error('Wallet not connected');
    }
    try {
      setTransactionStatus('pending');
      setSwapMessage('Preparing transaction...');
      
      // Get swap instructions
      const swapResponse = await fetchJupiterSwapInstructions({
        swapRequest: {
          quoteResponse: {
            ...quoteResponse,
            slippageBps: Math.round(solanaSlippagePercentage * 100)
          },
          userPublicKey: solanaWallet.publicKey.toString(),
          wrapUnwrapSOL: true,
          computeUnitPriceMicroLamports: null,
          asLegacyTransaction: false
        }
      });

      if (!swapResponse || !swapResponse.swapTransaction) {
        throw new Error('Failed to get swap transaction');
      }

      const swapTransactionBuf = Buffer.from(swapResponse.swapTransaction, 'base64');
      const transaction = VersionedTransaction.deserialize(swapTransactionBuf);

      if (!solanaWallet.signTransaction) {
        throw new Error('Wallet does not support transaction signing');
      }

      // Get connection once at the beginning
      const connection = getConnection();

      setSwapMessage('Please confirm the transaction in your wallet...');
      const signedTransaction = await solanaWallet.signTransaction(transaction);
      
      console.log('Sending transaction...');
      setSwapMessage('Sending transaction...');
      
      const signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
        skipPreflight: true,
        maxRetries: 2,
        preflightCommitment: 'processed'
      });
      
      console.log('Transaction sent, signature:', signature);
      setTransactionSignature(signature);
      setSwapMessage('Transaction submitted, waiting for confirmation...');

      // Monitor transaction status with both WebSocket and polling
      let confirmed = false;

      // Set up polling interval
      const pollInterval = setInterval(async () => {
        try {
          const status = await connection.getSignatureStatus(signature);
          console.log('Polling status:', status?.value?.confirmationStatus);
          
          if (status?.value?.confirmationStatus === 'confirmed' || 
              status?.value?.confirmationStatus === 'finalized') {
            clearInterval(pollInterval);
            if (!confirmed) {
              confirmed = true;
              setTransactionStatus('success');
              setSwapMessage('🎉 Transaction successful!');
              // Keep modal open to show success message
              // Remove the setTimeout that auto-closes the modal
            }
          } else if (status?.value?.err) {
            clearInterval(pollInterval);
            setTransactionStatus('error');
            setSwapMessage('❌ Transaction failed. Please try again.');
          }
        } catch (error) {
          console.error('Error polling transaction status:', error);
        }
      }, 1000);

      // Also use WebSocket for faster updates
      await solanaWebSocket.subscribeToTransaction(signature, {
        onStatusChange: (status) => {
          console.log('WebSocket status update:', status);
          setTransactionStatus(status);
          
          if (status === 'success' && !confirmed) {
            confirmed = true;
            clearInterval(pollInterval);
            setTransactionStatus('success');
            setSwapMessage('🎉 Transaction successful!');
          }
        },
        onFinality: (success) => {
          console.log('WebSocket finality:', success);
          if (success && !confirmed) {
            confirmed = true;
            clearInterval(pollInterval);
            setTransactionStatus('success');
            setSwapMessage('🎉 Transaction confirmed successfully!');
          }
        }
      });

      // Set a timeout to clear the polling interval
      setTimeout(() => {
        clearInterval(pollInterval);
        if (!confirmed) {
          setTransactionStatus('error');
          setSwapMessage('Transaction confirmation timeout. Please check Solscan for status.');
        }
      }, 60000); // 1 minute timeout

    } catch (error) {
      console.error('Swap failed:', error);
      setTransactionStatus('error');
      setSwapMessage(error instanceof Error ? `❌ ${error.message}` : '❌ Swap failed');
    }
  };

  const [transactionSignature, setTransactionSignature] = useState<string | null>(null);

  // Update the executeSolanaSwap function
  const executeSolanaSwap = async (quoteResponse: any) => {
    if (!solanaWallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    const slippageBps = Math.round(solanaSlippagePercentage * 100);
    console.log('Using slippage (bps):', slippageBps);

    const swapResponse = await fetchJupiterSwapInstructions({
      swapRequest: {
        quoteResponse: {
          ...quoteResponse,
          slippageBps
        },
        userPublicKey: solanaWallet.publicKey.toString(),
        wrapUnwrapSOL: true,
        computeUnitPriceMicroLamports: null,
        asLegacyTransaction: false
      }
    });

    if (!swapResponse || !swapResponse.swapTransaction) {
      throw new Error('Failed to get swap transaction');
    }

    const swapTransactionBuf = Buffer.from(swapResponse.swapTransaction, 'base64');
    const transaction = VersionedTransaction.deserialize(swapTransactionBuf);

    if (!solanaWallet.signTransaction) {
      throw new Error('Wallet does not support transaction signing');
    }

    const signedTransaction = await solanaWallet.signTransaction(transaction);

    // Send transaction with retries
    let signature: string | null = null;
    let retries = 0;
    const maxRetries = 3;

    while (retries < maxRetries && !signature) {
      try {
        signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
          skipPreflight: true,
          maxRetries: 3,
          preflightCommitment: 'processed'
        });
        console.log('Transaction sent, signature:', signature);
        break;
      } catch (error) {
        console.error(`Send attempt ${retries + 1} failed:`, error);
        retries++;
        if (retries === maxRetries) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * retries));
      }
    }

    if (!signature) {
      throw new Error('Failed to send transaction after retries');
    }

    // Use both polling and WebSocket for confirmation
    return new Promise((resolve, reject) => {
      let isResolved = false;
      const timeoutDuration = 60000; // 1 minute timeout
      let timeoutId: NodeJS.Timeout;
      let pollIntervalId: NodeJS.Timeout;

      const cleanup = () => {
        clearTimeout(timeoutId);
        clearInterval(pollIntervalId);
      };

      // Start polling immediately
      const pollStatus = async () => {
        try {
          const status = await connection.getSignatureStatus(signature!, {
            searchTransactionHistory: true
          });

          if (status.value?.err) {
            if (!isResolved) {
              isResolved = true;
              cleanup();
              reject(new Error(`Transaction failed: ${JSON.stringify(status.value.err)}`));
            }
            return;
          }

          if (status.value?.confirmationStatus === 'confirmed' || 
              status.value?.confirmationStatus === 'finalized') {
            if (!isResolved) {
              isResolved = true;
              cleanup();
              resolve(signature);
            }
            return;
          }
        } catch (error) {
          console.error('Error polling status:', error);
        }
      };

      // Poll every second
      pollIntervalId = setInterval(pollStatus, 1000);
      // Initial poll
      pollStatus();

      // Also use WebSocket for faster confirmation
      solanaWebSocket.subscribeToTransaction(signature, {
        onStatusChange: async (status) => {
          if (status === 'success' && !isResolved) {
            isResolved = true;
            cleanup();
            resolve(signature);
          } else if (status === 'error' && !isResolved) {
            isResolved = true;
            cleanup();
            reject(new Error('Transaction failed'));
          }
        },
        onFinality: (success) => {
          if (success && !isResolved) {
            isResolved = true;
            cleanup();
            resolve(signature);
          } else if (!success && !isResolved) {
            isResolved = true;
            cleanup();
            reject(new Error('Transaction failed on finality'));
          }
        }
      })

      // Set overall timeout
      timeoutId = setTimeout(() => {
        // Check one last time before timing out
        pollStatus().catch(() => {
          if (!isResolved) {
            isResolved = true;
            cleanup();
            reject(new Error('Transaction confirmation timeout'));
          }
        });
      }, timeoutDuration);
    });

  };

  // Helper function to get address lookup table accounts
  const getAddressLookupTableAccounts = async (
    connection: Connection,
    keys: string[]
  ): Promise<AddressLookupTableAccount[]> => {
    const addressLookupTableAccountInfos = await connection.getMultipleAccountsInfo(
      keys.map((key) => new PublicKey(key))
    ); // Remove the extra parenthesis here

    return addressLookupTableAccountInfos.reduce((acc, accountInfo, index) => {
      const addressLookupTableAddress = keys[index];
      if (accountInfo) {
        const addressLookupTableAccount = new AddressLookupTableAccount({
          key: new PublicKey(addressLookupTableAddress),
          state: AddressLookupTableAccount.deserialize(accountInfo.data),
        });
        acc.push(addressLookupTableAccount);
      }
      return acc;
    }, new Array<AddressLookupTableAccount>());
  };

  const confirmTransaction = async (connection: Connection, signature: string, timeout = 120000): Promise<'success' | 'timeout' | 'error'> => {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const signatureStatus = await connection.getSignatureStatus(signature);
      console.log('Current signature status:', signatureStatus);

      if (signatureStatus.value !== null) {
        if (signatureStatus.value.err) {
          console.error('Transaction error:', signatureStatus.value.err);
          return 'error';
        }
        if (signatureStatus.value.confirmationStatus === 'processed' || signatureStatus.value.confirmationStatus === 'confirmed' || signatureStatus.value.confirmationStatus === 'finalized') {
          return 'success';
        }
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    return 'timeout';
  };

  const checkTransactionOnExplorer = async (signature: string): Promise<'success' | 'error' | 'pending'> => {
    const explorerUrl = `https://public-api.solscan.io/transaction/${signature}`;
    try {
      const response = await fetch(explorerUrl);
      const data = await response.json();
      if (data.status === 'Success') {
        return 'success';
      } else if (data.status === 'Fail') {
        return 'error';
      } else {
        return 'pending';
      }
    } catch (error) {
      console.error('Error checking transaction on Solana Explorer:', error);
      return 'error';
    }
  };

  const verifySolscanTransaction = async (signature: string) => {
    const solscanUrl = `https://api.solscan.io/transaction?tx=${signature}`;
    try {
      const response = await fetch(solscanUrl);
      const data = await response.json();
      if (data.status === 'Success') {
        console.log('Transaction verified on Solscan:', solscanUrl);
        return true;
      } else {
        console.log('Transaction not found on Solscan:', solscanUrl);
        return false;
      }
    } catch (error) {
      console.error('Error verifying transaction on Solscan:', error);
      return false;
    }
  };

  const wallet = useWallet();

  // Make sure the wallet is connected before allowing the swap
  const isWalletConnected = wallet.connected && wallet.publicKey;

  // You might want to add a useEffect to check the wallet connection status
  useEffect(() => {
    if (wallet.connected) {
      console.log('Wallet connected:', wallet.publicKey?.toBase58());
    } else {
      console.log('Wallet not connected');
    }
  }, [wallet.connected, wallet.publicKey]);

  const [isEthConfirmationModalOpen, setIsEthConfirmationModalOpen] = useState(false);
  const [ethTransactionStatus, setEthTransactionStatus] = useState<'idle' | 'pending' | 'success' | 'rejected' | 'error'>('idle');
  const [ethTransactionHash, setEthTransactionHash] = useState<string | null>(null);
  const [estimatedGas, setEstimatedGas] = useState<bigint | undefined>();
  const [gasPrice, setGasPrice] = useState<bigint | undefined>();

  // Update handleTokenApproval to use the correct spender address
  const handleTokenApproval = async () => {
    if (!sellToken || !address || !sellAmount || !publicClient || !writeContract) {
      throw new Error('Missing parameters for token approval');
    }

    try {
      console.log('Checking approval for token:', sellToken.address);
      
      const sellAmountBigInt = parseUnits(sellAmount, sellToken.decimals);

      // Always use PERMIT2_ADDRESS as the spender
      const spenderAddress = PERMIT2_ADDRESS;
      console.log('Using Permit2 address:', spenderAddress);

      // Check current allowance for Permit2
      const allowance = await publicClient.readContract({
        address: sellToken.address as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [address as `0x${string}`, spenderAddress as `0x${string}`],
      });

      console.log('Current Permit2 allowance:', allowance?.toString());
      console.log('Required amount:', sellAmountBigInt.toString());

      if (!allowance || sellAmountBigInt > (allowance as bigint)) {
        console.log('Approval needed, preparing transaction...');
        
        const { request } = await publicClient.simulateContract({
          address: sellToken.address as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [spenderAddress as `0x${string}`, MAX_ALLOWANCE],
          account: address,
        });

        // Send the transaction
        await writeContract(request);

        // Wait for the transaction hash from the hook data
        if (!approveData) {
          throw new Error('No transaction hash received');
        }

        // Wait for confirmation
        const receipt = await publicClient.waitForTransactionReceipt({
          hash: approveData,
          confirmations: 1
        });

        if (receipt.status === 'reverted') {
          throw new Error('Transaction reverted');
        }

        console.log('Transaction confirmed:', receipt);

        if (receipt.status !== 'success') {
          throw new Error('Approval transaction failed');
        }

        console.log('Approval confirmed');
        
        // Add a small delay to ensure the blockchain state is updated
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } else {
        console.log('Token already has sufficient Permit2 allowance');
      }
    } catch (error: any) {
      console.error('Permit2 approval failed:', error);
      throw new Error(`Permit2 approval failed: ${error.message}`);
    }
  };

  // Add this function to get price first
  const getPrice = async (params: any) => {
    try {
      const response = await axios.get('/api/price', { params });
      return response.data;
    } catch (error) {
      console.error('Error getting price:', error);
      throw error;
    }
  };

  // Add this type and function near the top of the file, after the interfaces
  interface SwapMeta {
    title: string;
    description: string;
    tokens: Array<{
      address: string;
      symbol: string;
      decimals: number;
      amount: string;
    }>;
  }

  // Update the createSwapMeta function to handle potential null values
  const createSwapMeta = (
    sellToken: TokenData | SolanaToken | null,
    buyToken: TokenData | SolanaToken | null,
    sellAmount: string,
    buyAmount: string
  ): SwapMeta | null => {
    if (!sellToken || !buyToken) {
      return null;
    }

    return {
      title: 'Swap via 0x',
      description: `Swap ${sellAmount} ${sellToken.symbol} for ~${buyAmount} ${buyToken.symbol}`,
      tokens: [
        {
          address: sellToken.address,
          symbol: sellToken.symbol,
          decimals: sellToken.decimals,
          amount: sellAmount
        },
        {
          address: buyToken.address,
          symbol: buyToken.symbol,
          decimals: buyToken.decimals,
          amount: buyAmount
        }
      ]
    };
  };

  // Update the handleEthereumSwap function
  const handleEthereumSwap = async (): Promise<void> => {
    if (!sellToken || !buyToken || !sellAmount || !address || !publicClient) {
      console.error('Missing required parameters:', {
        sellToken: !!sellToken,
        buyToken: !!buyToken,
        sellAmount: !!sellAmount,
        address: !!address,
        publicClient: !!publicClient
      });
      setEthTransactionStatus('error');
      return;
    }

    try {
      setEthTransactionStatus('pending');
      
      const sellAmountInBaseUnits = parseUnits(
        sellAmount, 
        sellToken.decimals
      ).toString();

      const validatedSlippage = Math.min(Math.max(ethSlippagePercentage, 0.1), 50);
      const slippageBps = Math.round(validatedSlippage * 100);

      // First check if we need to approve tokens for Permit2
      if (sellToken.address.toLowerCase() !== ETH_ADDRESS.toLowerCase()) {
        try {
          const currentAllowance = await publicClient.readContract({
            address: sellToken.address as `0x${string}`,
            abi: ERC20_ABI,
            functionName: 'allowance',
            args: [
              address as `0x${string}`, 
              PERMIT2_ADDRESS as `0x${string}`
            ]
          }) as bigint;

          const sellAmountBigInt = BigInt(sellAmountInBaseUnits);
          
          if (currentAllowance < sellAmountBigInt) {
            console.log('Approving Permit2...');
            const { request } = await publicClient.simulateContract({
              address: sellToken.address as `0x${string}`,
              abi: ERC20_ABI,
              functionName: 'approve',
              args: [PERMIT2_ADDRESS as `0x${string}`, MAX_ALLOWANCE],
              account: address,
            });

            // Send the transaction
            await writeContract(request);

            // Wait for the transaction hash from the hook data
            if (!approveData) {
              throw new Error('No transaction hash received');
            }

            // Wait for confirmation
            const receipt = await publicClient.waitForTransactionReceipt({
              hash: approveData,
              confirmations: 1
            });

            if (receipt.status === 'reverted') {
              throw new Error('Transaction reverted');
            }

            console.log('Permit2 approved');
          }
        } catch (error) {
          console.error('Error checking/setting allowance:', error);
          setEthTransactionStatus('error');
          return;
        }
      }

      // Get quote with Permit2
      const params = {
        chainId: Number(chainId),
        sellToken: sellToken.address === ETH_ADDRESS ? 'ETH' : sellToken.address,
        buyToken: buyToken.address === ETH_ADDRESS ? 'ETH' : buyToken.address,
        sellAmount: sellAmountInBaseUnits,
        taker: address,
        slippageBps
      };

      console.log('Requesting quote with params:', params);

      const quoteResponse = await axios.get<QuoteResponse>('/api/quote', { params });
      const quote = quoteResponse.data;
      
      console.log('Quote received:', quote);

      if (!quote.transaction) {
        throw new Error('No transaction data in quote response');
      }

      // Handle Permit2 signature if needed
      let txData = quote.transaction.data as `0x${string}`;
      if (quote.permit2?.eip712) {
        console.log('Signing Permit2 message...');
        const typedData = {
          ...quote.permit2.eip712,
          types: quote.permit2.eip712.types,
          primaryType: quote.permit2.eip712.primaryType,
          domain: {
            ...quote.permit2.eip712.domain,
            verifyingContract: quote.permit2.eip712.domain.verifyingContract as `0x${string}`
          },
          message: quote.permit2.eip712.message
        };
        
        const signature = await signTypedDataAsync(typedData);
        
        const MAGIC_CALLDATA_STRING = "f".repeat(130);
        if (txData.includes(MAGIC_CALLDATA_STRING)) {
          txData = txData.replace(
            MAGIC_CALLDATA_STRING, 
            signature.slice(2)
          ) as `0x${string}`;
        } else {
          const signatureLengthInHex = numberToHex(size(signature), {
            signed: false,
            size: 32,
          });
          txData = concat([
            txData,
            signatureLengthInHex, 
            signature
          ]) as `0x${string}`;
        }
      }

      // Ensure we still have valid tokens before creating meta
      if (!sellToken || !buyToken) {
        throw new Error('Tokens became invalid during transaction preparation');
      }

      // Create meta object with type safety
      const buyAmountFormatted = formatUnits(BigInt(quote.buyAmount), buyToken.decimals);
      const meta = createSwapMeta(sellToken, buyToken, sellAmount, buyAmountFormatted);
      
      if (!meta) {
        throw new Error('Failed to create transaction metadata');
      }

      // Prepare transaction parameters with proper type assertions
      const txParams = {
        to: quote.transaction.to as `0x${string}`,
        data: txData.startsWith('0x') ? txData as `0x${string}` : `0x${txData}` as `0x${string}`,
        value: BigInt(quote.transaction.value || '0'),
        chainId: Number(chainId),
        gas: quote.transaction.gas ? BigInt(quote.transaction.gas) : undefined,
        gasPrice: quote.transaction.gasPrice ? BigInt(quote.transaction.gasPrice) : undefined,
        meta
      };

      console.log('Sending transaction with params:', {
        ...txParams,
        value: txParams.value.toString(),
        gas: txParams.gas?.toString(),
        gasPrice: txParams.gasPrice?.toString(),
      });

      const hash = await sendTransactionAsync(txParams);
      console.log('Transaction submitted:', hash);
      setEthTransactionHash(hash);

      // Update this section to use publicClient
      const receipt = await publicClient.waitForTransactionReceipt({
        hash,
        confirmations: 1
      });
      
      if (receipt.status === 'success') {
        setEthTransactionStatus('success');
      } else {
        setEthTransactionStatus('error');
      }

    } catch (error) {
      console.error('Swap error:', error);
      setEthTransactionStatus('error');
    }
  };

  // Add this near the top of the file, with other helper functions
  const formatNumberWithCommas = (value: string) => {
    if (!value) return '';
    
    // Split into whole and decimal parts
    const [wholePart, decimalPart] = value.split('.');
    
    // Add commas to whole number part
    const formattedWholePart = wholePart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    
    // Return with decimal part if it exists
    return decimalPart !== undefined ? `${formattedWholePart}.${decimalPart}` : formattedWholePart;
  };

  // Add state for USD values
  const [sellAmountUSD, setSellAmountUSD] = useState<string>('');
  const [buyAmountUSD, setBuyAmountUSD] = useState<string>('');

  // Helper function to format USD values
  const formatUSDValue = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const ethereumSwapContainerRef = useRef<HTMLDivElement>(null);
  const solanaSwapContainerRef = useRef<HTMLDivElement>(null);

  // Then update the usage
  const solanaTokenBalance = useSolanaTokenBalance(
    activeChain === 'solana' ? sellToken : null,
    solanaWallet.publicKey || null,
    connection
  );

  // Add this near the top of the component, with other state declarations
  const isSolanaSwapDisabled = useMemo(() => {
    // Check if wallet is not connected
    if (!solanaWallet.connected || !solanaWallet.publicKey) {
      return true;
    }

    // Check if tokens are not selected
    if (!sellToken || !buyToken) {
      return true;
    }

    // Check if amount is not entered or invalid
    if (!sellAmount || isNaN(parseFloat(sellAmount)) || parseFloat(sellAmount) <= 0) {
      return true;
    }

    // Check if transaction is pending
    if (transactionStatus === 'pending') {
      return true;
    }

    // Check if same token is selected for buy and sell
    if (sellToken.address === buyToken.address) {
      return true;
    }

    // Check if sell amount exceeds balance (if balance is available)
    if (solanaTokenBalance !== null) {
      const sellAmountNum = parseFloat(sellAmount);
      // Use the imported SOL_MINT_ADDRESSES
      const adjustedBalance = SOL_MINT_ADDRESSES.includes(sellToken.address) 
        ? Math.max(0, solanaTokenBalance - 0.01) // Leave 0.01 SOL for fees
        : solanaTokenBalance;
      
      if (sellAmountNum > adjustedBalance) {
        return true;
      }
    }

    return false;
  }, [
    solanaWallet.connected,
    solanaWallet.publicKey,
    sellToken,
    buyToken,
    sellAmount,
    transactionStatus,
    solanaTokenBalance
  ]);

  // Update the renderSolanaSwapInterface function
  const renderSolanaSwapInterface = () => {
    return (
      <div ref={solanaSwapContainerRef} className="flex-grow bg-gray-900 rounded-lg p-4 flex flex-col h-full">
        {/* Top section with wallet button */}
        <div>
          <WalletButton />
        </div>

        {/* Center the main swap interface */}
        <div className="flex-1 flex flex-col justify-center">
          {/* Sell section */}
          <div className="mb-4">
            <div className="flex justify-between mb-2">
              <span className="text-gray-400">Sell</span>
            </div>
            <div className="flex items-center bg-gray-800 rounded-lg p-3">
              <input
                type="text"
                value={formatDisplayAmount(sellAmount)}
                onChange={(e) => {
                  // Remove commas from the input
                  const rawValue = e.target.value.replace(/,/g, '');
                  
                  // Allow empty string, numbers, and decimals
                  // This regex allows: empty string, integers, decimals, and prevents multiple dots
                  if (rawValue === '' || /^\d*\.?\d*$/.test(rawValue)) {
                    // Prevent more than one decimal point
                    const decimalPoints = (rawValue.match(/\./g) || []).length;
                    if (decimalPoints <= 1) {
                      setSellAmount(rawValue);
                    }
                  }
                }}
                className="bg-transparent text-white text-2xl w-full outline-none"
                placeholder="0"
              />
              {renderTokenSelector(sellToken, () => openTokenSelectModal('sell'))}
            </div>
            <div className="flex justify-between mt-2 text-sm">
              <span className="text-gray-400">
                {solanaTokenBalance !== null && sellToken && (
                  formatBalanceDisplay(solanaTokenBalance, sellToken.symbol)
                )}
              </span>
            </div>
          </div>

          {/* Swap arrow */}
          <div className="flex justify-center mb-4">
            <div 
              className={`${darkThemeClasses.accent} p-2 rounded-full cursor-pointer ${darkThemeClasses.hover} transition-colors`}
              onClick={swapTokens}
            >
              <ArrowUpDown className={`h-6 w-6 ${activeChain === 'ethereum' ? 'text-[#77be44]' : 'text-[#9333ea]'}`} />
            </div>
          </div>

          {/* Buy section */}
          <div className="mb-4">
            <div className="flex justify-between mb-2">
              <span className="text-gray-400">Buy</span>
            </div>
            <div className="flex items-center bg-gray-800 rounded-lg p-3">
              <input
                type="text"
                value={formatDisplayAmount(buyAmount)}
                readOnly
                className="bg-transparent text-white text-2xl w-full outline-none"
                placeholder="0"
              />
              {renderTokenSelector(buyToken, () => openTokenSelectModal('buy'))}
            </div>
            <div className="flex justify-end mt-2 text-sm">
              {activeChain === 'ethereum' && buyTokenUsdValue && (
                <span className="text-gray-400">
                  {buyTokenUsdValue}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Bottom section - anchored to bottom */}
        <div className="mt-auto">
          {/* Slippage settings */}
          <div className="mb-4">
            <SolanaSlippageSettings
              slippage={solanaSlippagePercentage}
              onSlippageChange={setSolanaSlippagePercentage}
            />
          </div>

          {/* Swap button */}
          <button
            onClick={() => {
              if (solanaWallet.connected) {
                setIsConfirmationModalOpen(true);
              }
            }}
            disabled={isSolanaSwapDisabled}
            className={`w-full py-3 rounded-lg font-semibold ${
              isSolanaSwapDisabled
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-purple-500 text-white hover:bg-purple-600 transition-colors'
            }`}
          >
            {!solanaWallet.connected 
              ? 'Connect Wallet' 
              : transactionStatus === 'pending' 
                ? 'Swapping...' 
                : 'Swap'}
          </button>
        </div>
      </div>
    );
  };

  useEffect(() => {
    console.log('Sell Token:', sellToken);
    console.log('Buy Token:', buyToken);
    console.log('Sell Amount:', sellAmount);
  }, [sellToken, buyToken, sellAmount]);

  useEffect(() => {
    if (activeChain === 'solana') {
      // Initialize WebSocket connection here if needed
      // For example:
      // const ws = new WebSocket(wsEndpoint);
      // ... handle WebSocket events

      // Don't forget to close the WebSocket connection when the component unmounts
      // return () => {
      //   ws.close();
      // };
    }
  }, [activeChain, wsEndpoint]);

  useEffect(() => {
    const loadTokens = async () => {
      const chainId = 1; // Assuming Ethereum mainnet, adjust as needed
      const fetchedTokens = await fetchTokenList(chainId);
      
      // Transform the tokens to ensure proper typing
      const transformedTokens: TokenData[] = fetchedTokens.map(token => ({
        ...token,
        address: token.address.toLowerCase().startsWith('0x') 
          ? (token.address as `0x${string}`) 
          : (`0x${token.address}` as `0x${string}`),
        chainId,
        logoURI: token.logoURI || '',
        _timestamp: Date.now()
      }));

      setTokens(transformedTokens);
    };
    loadTokens();
  }, []);

  useEffect(() => {
    setSellToken(null);
    setBuyToken(null);
    setSellAmount('');
    setBuyAmount('');
  }, [activeChain]);

  // Add this state for tracking allowance status
  const [needsAllowance, setNeedsAllowance] = useState(false);
  const [allowanceTarget, setAllowanceTarget] = useState<string | null>(null);

  // Update token fetching when chain changes
  useEffect(() => {
    const fetchTokens = async () => {
      setIsLoadingTokens(true);
      try {
        if (activeChain === 'solana') {
          console.log('Fetching Solana tokens...');
          const solanaTokensList = await fetchSolanaTokens();
          console.log('Fetched Solana tokens:', solanaTokensList.length);
          setSolanaTokens(solanaTokensList);
          setTokens(solanaTokensList); // Solana tokens don't need transformation
        } else {
          console.log('Fetching EVM tokens...');
          const fetchedTokens = await fetchTokenList(chainId);
          console.log('Fetched EVM tokens:', fetchedTokens.length);
          
          // Transform the tokens to ensure proper typing
          const transformedTokens: TokenData[] = fetchedTokens.map(token => ({
            ...token,
            address: token.address.toLowerCase().startsWith('0x') 
              ? (token.address as `0x${string}`) 
              : (`0x${token.address}` as `0x${string}`),
            chainId,
            logoURI: token.logoURI || '',
            _timestamp: Date.now()
          }));

          setTokens(transformedTokens);
        }
      } catch (error) {
        console.error('Error fetching tokens:', error);
        setError('Failed to fetch tokens');
      } finally {
        setIsLoadingTokens(false);
      }
    };

    fetchTokens();
  }, [chainId, activeChain, fetchSolanaTokens]);

  useEffect(() => {
    // Initialize WebSocket connection
    solanaWebSocket.connect();

    // Cleanup on unmount
    return () => {
      // Add cleanup if needed
    };
  }, []);

  // Update useEffect for USD values
  useEffect(() => {
    const updateUSDValues = async () => {
      if (sellToken && sellAmount) {
        try {
          const price = await fetchTokenPrice(sellToken.address, activeChain);
          if (price > 0) {
            const usdValue = parseFloat(sellAmount.replace(/,/g, '')) * price;
            setSellAmountUSD(formatUSDValue(usdValue));
          }
        } catch (error) {
          console.error('Error fetching sell token price:', error);
          setSellAmountUSD('$0.00');
        }
      }

      if (buyToken && buyAmount) {
        try {
          const price = await fetchTokenPrice(buyToken.address, activeChain);
          if (price > 0) {
            const usdValue = parseFloat(buyAmount.replace(/,/g, '')) * price;
            setBuyAmountUSD(formatUSDValue(usdValue));
          }
        } catch (error) {
          console.error('Error fetching buy token price:', error);
          setBuyAmountUSD('$0.00');
        }
      }
    };

    updateUSDValues();
  }, [sellToken, buyToken, sellAmount, buyAmount, activeChain]);

  // Update the useEffect that handles chain switching
  useEffect(() => {
    // Reset all values when switching chains
    setSellToken(null);
    setBuyToken(null);
    setSellAmount('');
    setBuyAmount('');
    // Reset USD values
    setSellAmountUSD('');
    setBuyAmountUSD('');
    setSellTokenUsdValue('');
    setBuyTokenUsdValue('');
    // Reset any other relevant states
    setTransactionStatus('idle');
    setTransactionSignature(null);
    setSwapMessage('');
    setError(null);
    // Reset quote response
    setQuoteResponse(null);
    // Reset token selection modal state
    setIsTokenSelectModalOpen(false);
    setSelectingTokenFor(null);
    // Reset chart state
    if (chartRef.current) {
      chartRef.current.refreshChart();
    }
  }, [activeChain]);

  // Add these hooks at the top of the component
  const { data: sellTokenBalance } = useBalance({
    address,
    token: sellToken?.address as `0x${string}`,
    query: {
      enabled: !!sellToken && !!address && activeChain === 'ethereum'
    }
  });

  // Add state for USD values
  const [sellTokenUsdValue, setSellTokenUsdValue] = useState<string>('');
  const [buyTokenUsdValue, setBuyTokenUsdValue] = useState<string>('');

  // Update the useEffect for USD values with better optimization
  useEffect(() => {
    const updateUsdValues = debounce(async () => {
      try {
        if (sellToken) {
          const price = await fetchTokenPrice(sellToken.address, activeChain);
          if (sellAmount && price) {
            const usdValue = formatUsdValue(sellAmount, price);
            setSellTokenUsdValue(usdValue);
          }
        }

        if (buyToken && buyAmount) {
          const price = await fetchTokenPrice(buyToken.address, activeChain);
          if (price) {
            const usdValue = formatUsdValue(buyAmount, price);
            setBuyTokenUsdValue(usdValue);
          }
        }
      } catch (error) {
        console.error('Error updating USD values:', error);
      }
    }, 1000);

    if ((sellToken && sellAmount) || (buyToken && buyAmount)) {
      updateUsdValues();
    }

    return () => {
      updateUsdValues.cancel();
    };
  }, [sellToken, buyToken, sellAmount, buyAmount, activeChain]);

  // Add a separate effect for background price updates
  useEffect(() => {
    if (activeChain !== 'solana') return;

    const fetchPrices = async () => {
      try {
        if (sellToken) {
          await fetchJupiterPrice(sellToken.address);
        }
        if (buyToken) {
          await fetchJupiterPrice(buyToken.address);
        }
      } catch (error) {
        console.error('Error fetching Jupiter prices:', error);
      }
    };

    // Set up an interval to refresh prices
    const intervalId = setInterval(fetchPrices, 60000); // Refresh every minute

    // Initial fetch
    fetchPrices();

    return () => {
      clearInterval(intervalId);
    };
  }, [sellToken, buyToken, activeChain]);

  // Add this near the top of the component with other state declarations
  const isSwapDisabled = useMemo(() => {
    // For Ethereum chain
    if (activeChain === 'ethereum') {
      return (
        !isConnected || // Not connected
        !sellToken || // No sell token selected
        !buyToken || // No buy token selected
        !sellAmount || // No amount entered
        sellAmount === '0' || // Zero amount
        isNaN(parseFloat(sellAmount)) || // Invalid amount
        parseFloat(sellAmount) <= 0 || // Negative or zero amount
        isSwapPending || // Transaction pending
        sellToken.address === buyToken?.address || // Same token
        (sellTokenBalance && parseFloat(sellAmount) > parseFloat(formatUnits(sellTokenBalance.value, sellToken.decimals))) // Insufficient balance
      );
    }
    
    // For Solana chain
    return (
      !solanaWallet.connected || // Not connected
      !sellToken || // No sell token selected
      !buyToken || // No buy token selected
      !sellAmount || // No amount entered
      sellAmount === '0' || // Zero amount
      isNaN(parseFloat(sellAmount)) || // Invalid amount
      parseFloat(sellAmount) <= 0 || // Negative or zero amount
      transactionStatus === 'pending' || // Transaction pending
      sellToken.address === buyToken?.address || // Same token
      (solanaTokenBalance !== null && parseFloat(sellAmount) > solanaTokenBalance) // Insufficient balance
    );
  }, [
    activeChain,
    isConnected,
    sellToken,
    buyToken,
    sellAmount,
    isSwapPending,
    sellTokenBalance,
    solanaWallet.connected,
    transactionStatus,
    solanaTokenBalance
  ]);

  // Add a new hook for native ETH balance
  const { data: ethBalance } = useBalance({
    address,
    query: {
      enabled: !!address && activeChain === 'ethereum'
    }
  });

  // Add this helper function at the top level
  const formatBalance = (value: bigint, decimals: number, symbol: string) => {
    const formatted = formatUnits(value, decimals);
    const num = parseFloat(formatted);
    
    // For numbers >= 1, limit to 2 decimal places
    if (Math.abs(num) >= 1) {
      return `${num.toFixed(2)} ${symbol}`;
    }
    
    // For numbers < 1, keep all decimal places
    return `${formatted} ${symbol}`;
  };

  // Add a separate useEffect to monitor slippage changes
  useEffect(() => {
    console.log('ethSlippage state updated to:', ethSlippage, '%');
  }, [ethSlippage]);

  // Add this helper function to get the correct exchange proxy address for the current chain
  const getExchangeProxyAddress = (chainId: number): string => {
    return EXCHANGE_PROXY_ADDRESSES[chainId];
  };

  // Keep the original updateBuyAmount function for Ethereum
  const updateBuyAmount = useCallback(async () => {
    if (!sellToken || !buyToken || !sellAmount || parseFloat(sellAmount) <= 0) {
      setBuyAmount('');
      return;
    }

    setIsLoadingPrice(true);
    try {
      if (activeChain === 'solana') {
        // Solana quote logic
        const amountInBaseUnits = Math.floor(
          parseFloat(sellAmount.replace(/,/g, '')) * Math.pow(10, sellToken.decimals)
        ).toString();

        const slippageBps = Math.round(solanaSlippagePercentage * 100);
        console.log('Fetching Jupiter quote with slippage (bps):', slippageBps);

        const quoteResponse = await fetchJupiterQuote({
          inputMint: sellToken.address,
          outputMint: buyToken.address,
          amount: amountInBaseUnits,
          slippageBps,
          maxAccounts: 64
        });

        if (quoteResponse && quoteResponse.outAmount) {
          const formattedBuyAmount = (
            Number(quoteResponse.outAmount) / Math.pow(10, buyToken.decimals)
          ).toString();
          console.log('Setting buy amount from Jupiter:', formattedBuyAmount);
          setBuyAmount(formattedBuyAmount);
          setQuoteResponse(quoteResponse);
        }
        return; // Exit early for Solana
      }

      // Ethereum quote logic
      const sellTokenAddress = sellToken.address === ETH_ADDRESS ? 
        'ETH' : sellToken.address;
      
      const buyTokenAddress = buyToken.address === ETH_ADDRESS ?
        'ETH' : buyToken.address;

      const slippageDecimal = ethSlippagePercentage / 100;
      console.log('Using slippage for quote:', slippageDecimal);

      // Check if approval is needed for non-ETH tokens
      if (sellTokenAddress !== 'ETH') {
        const isEthTrade = buyTokenAddress.toLowerCase() === 'eth';
        const allowanceTarget = isEthTrade 
          ? getExchangeProxyAddress(chainId)
          : PERMIT2_ADDRESS;

        console.log('Checking allowance for:', {
          token: sellToken.symbol,
          owner: address,
          spender: allowanceTarget,
          amount: sellAmount
        });

        // Add a check for publicClient
        if (!publicClient) {
          console.error('Public client is not available');
          throw new Error('Public client is not available');
        }

        const currentAllowance = BigInt(await publicClient.readContract({
          address: sellToken.address as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'allowance',
          args: [address as `0x${string}`, allowanceTarget as `0x${string}`],
        }).toString());

        const sellAmountBigInt = parseUnits(sellAmount, sellToken.decimals);
        if (currentAllowance < sellAmountBigInt) {
          setNeedsAllowance(true);
          setAllowanceTarget(allowanceTarget);
          console.log('Token approval needed:', {
            currentAllowance: currentAllowance.toString(),
            requiredAmount: sellAmountBigInt.toString(),
            allowanceTarget
          });
          return;
        }
      }

      const response = await axios.get(API_SWAP_PRICE_URL, {
        params: {
          chainId,
          sellToken: sellTokenAddress,
          buyToken: buyTokenAddress,
          sellAmount: parseUnits(sellAmount, sellToken.decimals).toString(),
          taker: address,
          ...(sellTokenAddress.toLowerCase() === 'eth' || buyTokenAddress.toLowerCase() === 'eth'
            ? {
                slippagePercentage: (ethSlippagePercentage / 100).toString(),
                affiliateAddress: FEE_RECIPIENT,
                affiliateFee: '0.01'
              }
            : {
                slippageBps: Math.round(ethSlippagePercentage * 100).toString(),
                swapFeeRecipient: FEE_RECIPIENT,
                swapFeeBps: '15',
                swapFeeToken: buyTokenAddress
              }),
          enableSlippageProtection: true,
          integrator: 'uruloki-dex'
        }
      });

      if (response.data.buyAmount) {
        setBuyAmount(formatUnits(response.data.buyAmount, buyToken.decimals));
      }
    } catch (error) {
      console.error('Error fetching price:', error);
      setBuyAmount('');
      setSwapMessage(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoadingPrice(false);
    }
  }, [
    sellToken,
    buyToken,
    sellAmount,
    activeChain,
    chainId,
    address,
    ethSlippagePercentage,
    solanaSlippagePercentage,
    publicClient
  ]);

  const debouncedUpdateBuyAmount = useCallback(
    debounce(updateBuyAmount, 500),
    [updateBuyAmount]
  );

  useEffect(() => {
    debouncedUpdateBuyAmount();
    return () => debouncedUpdateBuyAmount.cancel();
  }, [sellToken, buyToken, sellAmount, debouncedUpdateBuyAmount]);

  // Add this before the return statement
  const renderEthereumSwapInterface = () => (
    <div 
      ref={ethereumSwapContainerRef} 
      className={`flex-grow ${darkThemeClasses.primary} rounded-lg p-4 flex flex-col h-full`}
    >
      {/* Top section with wallet connect only */}
      <div>
        <CustomConnectButton />
      </div>

      {/* Rest of the interface remains the same */}
      <div className="flex-1 flex flex-col justify-center">
        {/* Sell section */}
        <div className="mb-4">
          <div className="flex justify-between mb-2">
            <span className="text-gray-400">Sell</span>
          </div>
          <div className={`flex items-center ${darkThemeClasses.secondary} rounded-lg p-3`}>
            <input
              type="text"
              value={formatDisplayAmount(sellAmount)}
              onChange={(e) => {
                const rawValue = e.target.value.replace(/,/g, '');
                if (rawValue === '' || /^\d*\.?\d*$/.test(rawValue)) {
                  const decimalPoints = (rawValue.match(/\./g) || []).length;
                  if (decimalPoints <= 1) {
                    setSellAmount(rawValue);
                  }
                }
              }}
              className="bg-transparent text-white text-2xl w-full outline-none"
              placeholder="0"
            />
            {renderTokenSelector(sellToken, () => openTokenSelectModal('sell'))}
          </div>
          <div className="flex justify-between mt-2 text-sm">
            <span className="text-gray-400">
              {sellToken && (
                <>
                  {sellToken.address.toLowerCase() === ETH_ADDRESS.toLowerCase() 
                    ? ethBalance 
                      ? formatBalanceDisplay(parseFloat(formatUnits(ethBalance.value, 18)), 'ETH')
                      : 'Balance: 0 ETH'
                    : sellTokenBalance
                      ? formatBalanceDisplay(parseFloat(formatUnits(sellTokenBalance.value, sellTokenBalance.decimals)), sellTokenBalance.symbol)
                      : `Balance: 0 ${sellToken.symbol}`
                  }
                </>
              )}
            </span>
            {activeChain === 'ethereum' && sellTokenUsdValue && (
              <span className="text-gray-400">
                {sellTokenUsdValue}
              </span>
            )}
          </div>
        </div>

        {/* Swap arrow */}
        <div className="flex justify-center mb-4">
          <div 
            className={`${darkThemeClasses.accent} p-2 rounded-full cursor-pointer ${darkThemeClasses.hover} transition-colors`}
            onClick={swapTokens}
          >
            <ArrowUpDown className={`h-6 w-6 ${activeChain === 'ethereum' ? 'text-[#77be44]' : 'text-[#9333ea]'}`} />
          </div>
        </div>

        {/* Buy section */}
        <div className="mb-4">
          <div className="flex justify-between mb-2">
            <span className="text-gray-400">Buy</span>
          </div>
          <div className={`flex items-center ${darkThemeClasses.secondary} rounded-lg p-3`}>
            <input
              type="text"
              value={formatDisplayAmount(buyAmount)}
              readOnly
              className="bg-transparent text-white text-2xl w-full outline-none"
              placeholder="0"
            />
            {renderTokenSelector(buyToken, () => openTokenSelectModal('buy'))}
          </div>
          <div className="flex justify-end mt-2 text-sm">
            {activeChain === 'ethereum' && buyTokenUsdValue && (
              <span className="text-gray-400">
                {buyTokenUsdValue}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Bottom section - anchored to bottom */}
      <div className="mt-auto">
        {/* Slippage settings */}
        <div className="mb-4">
          <EthSlippageSettings
            slippage={ethSlippagePercentage}
            onSlippageChange={(newSlippage: number) => {
              console.log('Updating slippage to:', newSlippage, '%');
              setEthSlippagePercentage(newSlippage);
            }}
          />
        </div>

        {/* Swap button */}
        <button
          onClick={() => {
            if (isConnected) {
              setIsEthConfirmationModalOpen(true);
            }
          }}
          disabled={isSwapDisabled}
          className={`w-full py-3 rounded-lg font-semibold ${
            isSwapDisabled
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-[#77be44] text-white hover:bg-[#69aa3b] transition-colors'
          }`}
        >
          {!isConnected 
            ? 'Connect Wallet' 
            : isSwapPending 
              ? 'Swapping...' 
              : 'Swap'}
        </button>
      </div>

      {/* Add the EthereumConfirmationModal */}
      <EthereumConfirmationModal
        isOpen={isEthConfirmationModalOpen}
        onClose={() => {
          setIsEthConfirmationModalOpen(false);
          setEthTransactionStatus('idle');
        }}
        onConfirm={handleEthereumSwap}
        sellAmount={sellAmount}
        buyAmount={buyAmount}
        sellToken={sellToken}
        buyToken={buyToken}
        slippage={ethSlippagePercentage}
        transactionHash={ethTransactionHash}
        containerRef={ethereumSwapContainerRef}
        transactionStatus={ethTransactionStatus}
        estimatedGas={estimatedGas}
        gasPrice={gasPrice}
        chainId={chainId}
      />
    </div>
  );

  return (
    <div className="flex flex-col w-full max-w-[1400px] mx-auto justify-center">
      <div className="w-full mb-4">
        <ChainToggle activeChain={activeChain} setActiveChain={setActiveChain} />
      </div>
      <div className="flex flex-col xl:flex-row gap-4 w-full justify-center items-start">
        <div className={`w-full xl:w-[52.5%] ${darkThemeClasses.secondary} rounded-lg overflow-hidden`} style={{ height: '550px' }}>
          <TokenChart 
            ref={chartRef}
            selectedToken={activeChain === 'solana' ? buyToken : buyToken}
            chainId={activeChain === 'solana' ? 'solana' : chainId}
            activeChain={activeChain}
          />
        </div>
        <div className="w-full xl:w-[30%] flex flex-col" style={{ height: '550px' }}>
          {activeChain === 'ethereum' ? (
            <div className={`h-full ${darkThemeClasses.primary} rounded-lg relative`}>
              {renderEthereumSwapInterface()}
            </div>
          ) : (
            <div className="h-full bg-gray-900 rounded-lg relative">
              {renderSolanaSwapInterface()}
              <SwapConfirmationModal
                isOpen={isConfirmationModalOpen}
                onClose={() => {
                  setIsConfirmationModalOpen(false);
                  setTransactionStatus('idle'); // Reset status when closing
                }}
                onConfirm={handleConfirmSwap}
                sellAmount={sellAmount}
                buyAmount={buyAmount}
                sellToken={sellToken?.symbol || ''}
                buyToken={buyToken?.symbol || ''}
                slippage={solanaSlippagePercentage} // Use the same slippage value
                transactionSignature={transactionSignature}
                containerRef={solanaSwapContainerRef}
                transactionStatus={transactionStatus}
                error={swapError}
              />
            </div>
          )}
        </div>
        {isTokenSelectModalOpen && (
          <TokenSelectModal
            tokens={activeChain === 'solana' ? solanaTokens : tokens}
            onClose={() => setIsTokenSelectModalOpen(false)}
            onSelect={(token: TokenData) => handleTokenSelect(token)}
            chainId={activeChain === 'solana' ? 'solana' : chainId}
            activeChain={activeChain}
            isLoading={isLoadingTokens}
            setShowTokenSelect={setShowTokenSelect}
          />
        )}
      </div>
      {showTokenSelect && (
        <TokenSelectModal
          tokens={tokens}
          onClose={() => setShowTokenSelect(false)}
          onSelect={(token: TokenData) => handleTokenSelect(token)}
          chainId={chainId}
          activeChain={activeChain}
          isLoading={isLoadingTokens}
          setShowTokenSelect={setShowTokenSelect}
        />
      )}
      {pendingTxSignature && (
        <div className="mt-4 p-4 rounded-lg bg-gray-100">
          <p className="text-sm">
            Transaction Status: {txStatus}
            {txStatus === 'pending' && <span className="animate-pulse"> ...</span>}
          </p>
          <a 
            href={`https://solscan.io/tx/${pendingTxSignature}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-600 text-sm"
          >
            View on Explorer
          </a>
        </div>
      )}
    </div>
  );
}

async function retryTransaction(
  connection: Connection,
  signedTransaction: VersionedTransaction,
  maxRetries = 3,
  initialBackoff = 1000
): Promise<string> {
  let retries = 0;
  while (retries < maxRetries) {
    try {
      const signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
        skipPreflight: true,
        maxRetries: 1,
        preflightCommitment: 'confirmed',
      });
      console.log('Transaction sent, signature:', signature);
      return signature;
    } catch (error) {
      console.error(`Transaction failed (attempt ${retries + 1}):`, error);
      retries++;
      if (retries >= maxRetries) throw error;
      await new Promise(resolve => setTimeout(resolve, initialBackoff * Math.pow(2, retries - 1)));
    }
  }
  throw new Error('Max retries reached');
}

async function confirmTransaction(connection: Connection, signature: string, timeout = 30000) {
  const start = Date.now();
  let status = await connection.getSignatureStatus(signature);
  
  while (Date.now() - start < timeout) {
    if (status?.value?.confirmationStatus === 'confirmed' || status?.value?.confirmationStatus === 'finalized') {
      return status;
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
    status = await connection.getSignatureStatus(signature);
  }
  
  throw new Error(`Transaction was not confirmed in ${timeout / 1000} seconds`);
}

// Add these helper functions
const checkAllowance = async (tokenAddress: string, ownerAddress: string, spenderAddress: string) => {
  const provider = new ethers.BrowserProvider(window.ethereum);
  const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
  return await contract.allowance(ownerAddress, spenderAddress);
};

const requestApproval = async (tokenAddress: string, spenderAddress: string, amount: bigint) => {
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const contract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
  const tx = await contract.approve(spenderAddress, amount);
  await tx.wait();
};

const getSigner = async () => {
  const provider = new ethers.BrowserProvider(window.ethereum);
  return provider.getSigner();
};

const deserializeInstruction = (instruction: any) => {
  if (!instruction || !instruction.programId || !instruction.accounts || !instruction.data) {
    throw new Error('Invalid instruction format');
  }
  return {
    programId: new PublicKey(instruction.programId),
    keys: instruction.accounts.map((key: any) => ({
      pubkey: new PublicKey(key.pubkey),
      isSigner: key.isSigner,
      isWritable: key.isWritable,
    })),
    data: Buffer.from(instruction.data, 'base64'),
  };
};

const getAddressLookupTableAccounts = async (
  connection: Connection,
  keys: string[]
): Promise<AddressLookupTableAccount[]> => {
  const addressLookupTableAccountInfos = await connection.getMultipleAccountsInfo(
    keys.map((key) => new PublicKey(key))
  ); // Remove the extra parenthesis here

  return addressLookupTableAccountInfos.reduce((acc, accountInfo, index) => {
    const addressLookupTableAddress = keys[index];
    if (accountInfo) {
      const addressLookupTableAccount = new AddressLookupTableAccount({
        key: new PublicKey(addressLookupTableAddress),
        state: AddressLookupTableAccount.deserialize(accountInfo.data),
      });
      acc.push(addressLookupTableAccount);
    }
    return acc;
  }, new Array<AddressLookupTableAccount>());
};

// Add this helper function for formatting balances consistently
const formatBalanceDisplay = (balance: number | null, symbol: string) => {
  if (balance === null) return '';
  
  // For numbers >= 1, limit to 2 decimal places
  if (Math.abs(balance) >= 1) {
    return `Balance: ${balance.toFixed(2)} ${symbol}`;
  }
  
  // For numbers < 1, keep all decimal places
  return `Balance: ${balance} ${symbol}`;
};

const estimateGasForTransaction = async (txParams: any) => {
  if (!publicClient) {
    throw new Error('Public client not available');
  }

  try {
    const gasEstimate = await publicClient.estimateGas(txParams);
    return gasEstimate;
  } catch (error) {
    console.error('Error estimating gas:', error);
    throw error;
  }
};

// Add this type guard function
const isPublicClientAvailable = (client: any): client is PublicClient => {
  return client !== null && client !== undefined && typeof client.readContract === 'function';
};

type RainbowKitAccount = {
  address: string;
  balanceDecimals?: number;
  balanceFormatted?: string;
  balanceSymbol?: string;
  displayBalance?: string;
  displayName: string;
  ensAvatar?: string;
  ensName?: string;
  hasPendingTransactions: boolean;
};

type Wallet = {
  connector: any;
  id: string;
  name: string;
  shortName?: string;
  iconUrl?: string | (() => Promise<string>);
  iconBackground?: string;
  installed?: boolean;
  downloadUrls?: {
    android?: string;
    ios?: string;
    mobile?: string;
    qrCode?: string;
    chrome?: string;
    firefox?: string;
    edge?: string;
    safari?: string;
    opera?: string;
    browserExtension?: string;
  };
  createConnector: () => {
    connector: any;
    mobile?: {
      getUri?: () => Promise<string>;
    };
    qrCode?: {
      getUri: () => Promise<string>;
      instructions?: {
        learnMoreUrl: string;
        steps: Array<{
          description: string;
          step: string;
          title: string;
        }>;
      };
    };
  };
};

const CustomConnectButton = () => {
  return (
    <ConnectButton />
  );
};


































































































