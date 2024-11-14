'use client';

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { ChevronDown, ArrowUpDown, Search, X, Wallet, ArrowUp } from "lucide-react";
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
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { formatUnits, parseUnits, encodeFunctionData, toHex, getContract, concat, numberToHex, size, Hex } from "viem";
import { Address } from 'viem';
import { MAINNET_TOKENS, MAX_ALLOWANCE, MAINNET_EXCHANGE_PROXY } from "../../src/constants";
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import TokenChart, { TokenChartRef } from './TokenChart';
import TokenSelector from '../token-list/TokenSelector';
import { fetchTokenList, Token } from '../../lib/fetchTokenList';
import { fetchTokenPrice } from '../utils/priceUtils';
import { EXCHANGE_PROXY_ABI, EXCHANGE_PROXY_ADDRESSES, ERC20_ABI, MAINNET_TOKENS_BY_SYMBOL, ETH_ADDRESS, API_SWAP_PRICE_URL, FEE_RECIPIENT, AFFILIATE_FEE, ZEROX_BASE_URLS } from '@app/constants';
import TokenSelectModal from '@/app/components/TokenSelectModal';
import { simulateContract, waitForTransactionReceipt, readContract } from 'wagmi/actions';
import ChainToggle from './ChainToggle';
import MainTrading from './ChainToggle';
import { WalletButton } from './WalletButton';
import TokenImage from './TokenImage';
import { mainnet, polygon, optimism, arbitrum, base, avalanche, bsc, linea, mantle, scroll } from 'wagmi/chains';
import { fetchJupiterQuote, getSwapInstructions, NATIVE_SOL_MINT, WRAPPED_SOL_MINT, fetchSwapInstructions, getInputMint, getOutputMint } from '@/app/utils/jupiterApi';
import { Connection, sendAndConfirmTransaction, PublicKey, Transaction, VersionedTransaction, TransactionInstruction, Commitment, AddressLookupTableProgram, TransactionMessage, AddressLookupTableAccount, ConnectionConfig, VersionedMessage } from '@solana/web3.js';
import { getConnection, getLatestBlockhashWithRetry, sendAndConfirmTransactionWithRetry, getWebSocketEndpoint } from '../utils/solanaUtils';
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
import { solanaWebSocket } from '../utils/solanaWebSocket';
import { checkTransactionOnExplorer } from '../utils/solanaUtils'; // Add this import
import { fetchJupiterSwapInstructions } from '../utils/jupiterApi';
import { ethers } from 'ethers';
import EthSlippageSettings from './EthSlippageSettings';
import { ETH_DEFAULT_SLIPPAGE_PERCENTAGE } from '@app/constants';
import { PERMIT2_ADDRESS } from '@app/constants';
import { WETH_ADDRESS } from '@app/constants';
import { permit2Abi } from '@/src/utils/permit2abi'; // Update this import path
import { MANUAL_WETH_TOKEN } from '@app/constants';
import { fetchAvalanchePrice, fetchAvalancheQuote } from '../utils/avalancheUtils';
import { AVALANCHE_CHAIN_ID, AVALANCHE_TOKENS, JOE_TOKEN_ADDRESS, NATIVE_TOKEN_ADDRESS } from '../constants';
import { MaxUint256 } from 'ethers';
import { fetchArbitrumTokens } from '../utils/arbitrumUtils';
import { fetchPolygonTokens } from '../utils/polygonUtils';
import { fetchOptimismTokens } from '../utils/optimismUtils';
import { ARBITRUM_CHAIN_ID, POLYGON_CHAIN_ID, OPTIMISM_CHAIN_ID, ETHEREUM_CHAIN_ID } from '@app/constants';
import { fetchAvalancheTokens } from '../utils/avalancheUtils';
import { fetchSolanaTokens } from '../utils/solanaUtils'; // Make sure this import exists




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

const checkBalance = async (solanaWallet: any) => {
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


export default function UnifiedSwapInterface({ activeChain, setActiveChain }: {
  activeChain: 'ethereum' | 'solana';
  setActiveChain: (chain: 'ethereum' | 'solana') => void;
}) {
  // State declarations must be at the top level of your component
  const [isLoadingTokens, setIsLoadingTokens] = useState<boolean>(false);
  const [showTokenSelect, setShowTokenSelect] = useState<boolean>(false);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [solanaTokens, setSolanaTokens] = useState<SolanaToken[]>([]);

  // Use the regular HTTP connection
  const connection = useMemo(() => 
    new Connection(SOLANA_RPC_ENDPOINTS.http, 'confirmed'),
    []
  );
  
  // Get the WebSocket endpoint
  const wsEndpoint = getWebSocketEndpoint();

  // State declarations
  const [sellToken, setSellToken] = useState<Token | SolanaToken | null>(null);
  const [buyToken, setBuyToken] = useState<Token | SolanaToken | null>(null);
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
  const { waitForTransactionReceipt } = useWaitForTransactionReceipt();
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

  const { data: allowance, refetch: refetchAllowance } = useContractRead({
    address: sellToken?.address as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [address as `0x${string}`, exchangeProxyAddress],
    enabled: !!sellToken && !!address,
    watch: true,
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

  const handleApprove = async () => {
    if (!walletClient || !allowanceTarget || !sellToken || !address) {
      console.error('Missing required parameters for approval');
      return;
    }

    try {
      console.log('Approving token:', sellToken.address, 'for spender:', allowanceTarget);
      
      const tokenContract = {
        address: sellToken.address as `0x${string}`,
        abi: ERC20_ABI,
      };

      // First check current allowance
      const currentAllowance = await publicClient.readContract({
        ...tokenContract,
        functionName: 'allowance',
        args: [address, allowanceTarget as `0x${string}`],
      });

      if (currentAllowance > 0n) {
        console.log('Token already has allowance:', currentAllowance.toString());
        setNeedsAllowance(false);
        return;
      }

      // Send approval transaction
      const hash = await walletClient.writeContract({
        ...tokenContract,
        functionName: 'approve',
        args: [allowanceTarget as `0x${string}`, MAX_UINT256],
      });

      console.log('Approval transaction submitted:', hash);

      // Wait for transaction confirmation
      const receipt = await publicClient.waitForTransactionReceipt({
        hash,
        timeout: 60_000,
      });

      console.log('Approval confirmed:', receipt);
      setNeedsAllowance(false);
      
      // Refetch quote after approval
      await fetchQuote();

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
  const checkAndApproveToken = async (tokenAddress: string, spenderAddress: string, amount: bigint) => {
    try {
      console.log('Checking approval for:', {
        tokenAddress,
        spenderAddress,
        amount: amount.toString()
      });

      const tokenContract = {
        address: tokenAddress as `0x${string}`,
        abi: erc20Abi,
      };

      // Check current allowance
      const currentAllowance = await publicClient.readContract({
        ...tokenContract,
        functionName: 'allowance',
        args: [address, spenderAddress],
      });

      console.log('Current allowance:', currentAllowance.toString());

      if (currentAllowance < amount) {
        console.log('Approval needed. Requesting approval for:', amount.toString());
        
        const { request } = await publicClient.simulateContract({
          ...tokenContract,
          functionName: 'approve',
          args: [spenderAddress, MaxUint256], // Use max approval
          account: address,
        });

        const hash = await walletClient.writeContract(request);
        console.log('Approval transaction submitted:', hash);

        const receipt = await publicClient.waitForTransactionReceipt({
          hash,
          timeout: 60_000,
        });

        console.log('Approval confirmed:', receipt);
        return true;
      }

      console.log('Token already approved');
      return true;
    } catch (error) {
      console.error('Approval error:', error);
      throw new Error(`Failed to approve token: ${error.message}`);
    }
  };

  // Update the fetchQuote function
  const fetchQuote = async () => {
    try {
      const response = await axios.get('/api/swap-price', {
        params: {
          chainId,
          sellToken: sellToken?.address as `0x${string}`,
          buyToken: buyToken?.address as `0x${string}`,
          sellAmount: parseUnits(sellAmount, sellToken?.decimals || 0).toString(),
          takerAddress: address,
        }
      });
      
      console.log('Raw quote response:', response.data);
      
      if (!response.data?.transaction?.to || !response.data?.transaction?.data) {
        console.error('Invalid quote response:', response.data);
        throw new Error('Invalid quote response - missing transaction details');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching quote:', error);
      throw error;
    }
  };

  // Add this function to check and set allowance
  const checkAndSetAllowance = async (
    sellToken: Token,
    sellAmount: bigint,
    address: `0x${string}`,
    walletClient: WalletClient,
    publicClient: PublicClient
  ) => {
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
      const currentAllowance = await publicClient.readContract({
        address: sellToken.address as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [address, PERMIT2_ADDRESS as `0x${string}`]
      }) as bigint;

      console.log('Current allowance:', currentAllowance.toString());
      console.log('Required amount:', sellAmount.toString());

      // If allowance is insufficient, request approval
      if (currentAllowance < sellAmount) {
        console.log('Insufficient allowance, requesting approval...');

        try {
          // Simulate the approval transaction
          const { request } = await publicClient.simulateContract({
            address: sellToken.address as `0x${string}`,
            abi: ERC20_ABI,
            functionName: 'approve',
            args: [PERMIT2_ADDRESS as `0x${string}`, MAX_ALLOWANCE],
            account: address
          });

          console.log('Approval simulation successful, sending transaction...');

          // Send the approval transaction
          const hash = await walletClient.writeContract(request);
          console.log('Approval transaction hash:', hash);

          // Wait for transaction confirmation
          const receipt = await publicClient.waitForTransactionReceipt({ 
            hash,
            timeout: 60_000,
            confirmations: 1
          });

          if (receipt.status === 'reverted') {
            throw new Error('Approval transaction reverted');
          }

          console.log('Approval confirmed:', receipt);
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
        data: txData,
        value: BigInt(quote.transaction.value || '0'),
        chainId,
        gas: quote.transaction.gas ? BigInt(quote.transaction.gas) : undefined,
        // Add metadata for better MetaMask display
        meta: {
          title: 'Swap via 0x',
          description: `Swap ${sellAmount} ${sellToken.symbol} for ~${
            formatUnits(BigInt(quote.buyAmount), buyToken.decimals)
          } ${buyToken.symbol}`,
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
              amount: quote.buyAmount
            }
          ]
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
    return () => {
      if (pendingTxSignature) {
        solanaWebSocket.unsubscribeFromTransaction(pendingTxSignature);
      }
    };
  }, [pendingTxSignature]);

  // Add this helper function to properly format token addresses for Avalanche
  const getProperTokenAddress = (token: Token | null, chainId: number) => {
    if (!token) return null;
    
    // Handle native AVAX
    if (chainId === AVALANCHE_CHAIN_ID && token.address.toLowerCase() === ETH_ADDRESS.toLowerCase()) {
      return NATIVE_TOKEN_ADDRESS;
    }
    
    return token.address;
  };

  // Add this new function to handle WETH approval
  const handleWETHApproval = async (amount: bigint) => {
    const wethContract = getContract({
      address: WETH_ADDRESS as `0x${string}`,
      abi: erc20Abi,
      publicClient,
      walletClient,
    });

    const allowance = await wethContract.read.allowance([address as `0x${string}`, PERMIT2_ADDRESS]);
    if (allowance < amount) {
      try {
        const { request } = await wethContract.simulate.approve([PERMIT2_ADDRESS, MAX_ALLOWANCE]);
        const hash = await wethContract.write.approve(request.args);
        await publicClient.waitForTransactionReceipt({ hash });
        console.log('WETH approval successful');
      } catch (error) {
        console.error('WETH approval failed:', error);
        throw new Error('WETH approval failed');
      }
    }
  };

  const swapTokens = () => {
    setSellToken(buyToken);
    setBuyToken(sellToken);
    setSellAmount(buyAmount);
    setBuyAmount(sellAmount);
  };

  const [availableTokens, setAvailableTokens] = useState<Token[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);

  const fetchTokensForChain = useCallback(async () => {
    if (!chainId) return;

    try {
      console.log('Fetching tokens for chain ID:', chainId);
      let tokens: Token[] = [];

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
          tokens = await fetchTokenList(chainId);
      }

      if (tokens && Array.isArray(tokens)) {
        // Ensure tokens have required properties and are unique
        const validTokens = tokens
          .filter(token => token.address && token.symbol && token.name)
          .filter((token, index, self) => 
            index === self.findIndex(t => t.address.toLowerCase() === token.address.toLowerCase())
          );

        console.log(`Setting ${validTokens.length} valid tokens for chain ${chainId}`);
        setAvailableTokens(validTokens);
      }
    } catch (error) {
      console.error(`Error fetching tokens for chain ${chainId}:`, error);
      setAvailableTokens([]);
    }
  }, [chainId]);

  useEffect(() => {
    fetchTokensForChain();
  }, [fetchTokensForChain, chainId]);

  const fetchSolanaTokens = useCallback(async () => {
    const response = await fetch('https://token.jup.ag/strict');
    const tokens = await response.json();
    
    // Add native SOL to the list
    tokens.unshift({
      address: '11111111111111111111111111111111',
      symbol: 'SOL',
      name: 'Solana',
      decimals: 9,
      logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png'
    });

    setSolanaTokens(tokens);
  }, []);

  useEffect(() => {
    if (activeChain === 'ethereum') {
      fetchTokensForChain();
    } else if (activeChain === 'solana') {
      fetchSolanaTokens();
    }
  }, [activeChain, chainId, fetchTokensForChain, fetchSolanaTokens]);

  const openTokenSelectModal = (type: 'sell' | 'buy') => {
    setSelectingTokenFor(type);
    setIsTokenSelectModalOpen(true);
  };

  const closeTokenSelectModal = () => {
    setIsTokenSelectModalOpen(false);
    setSelectingTokenFor(null);
  };

  const handleTokenSelect = (token: Token) => {
    const selectedToken = {
      ...token,
      logoURI: token.logoURI || '',
      _timestamp: Date.now(), // Add timestamp for forcing re-render
    };

    if (selectingTokenFor === 'sell') {
      setSellToken(selectedToken);
    } else if (selectingTokenFor === 'buy') {
      setBuyToken(selectedToken);
    }
    
    setIsTokenSelectModalOpen(false);
    setSelectingTokenFor(null);
  };

  const renderTokenSelector = (token: Token | null, onClick: () => void) => (
    <button
      onClick={onClick}
      className="flex items-center space-x-2 bg-[#1a1b1f] rounded-2xl px-4 py-2 hover:bg-[#2c2d33]"
    >
      {token ? (
        <>
          <div 
            className="w-8 h-8 rounded-full overflow-hidden"
            key={`${token.address}-${token.logoURI}-${token._timestamp}`} // Add key here
          >
            <TokenImage
              src={token.logoURI}
              alt={token.symbol}
              width={32}
              height={32}
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-white">{token.symbol}</span>
        </>
      ) : (
        <span className="text-white">Select Token</span>
      )}
    </button>
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

  const [slippageTolerance, setSlippageTolerance] = useState<number>(300); // Fixed 3% (300 basis points)

  const [swapStatus, setSwapStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [swapMessage, setSwapMessage] = useState<string>('');
  const [inputToken, setInputToken] = useState<string>('');
  const [outputToken, setOutputToken] = useState<string>('');
  const [inputAmount, setInputAmount] = useState<string>('');
  const [quoteResponse, setQuoteResponse] = useState<any>(null);

  const [isLoadingPrice, setIsLoadingPrice] = useState(false);

  const updateBuyAmount = useCallback(async () => {
    if (sellToken && buyToken && sellAmount && parseFloat(sellAmount) > 0) {
      setIsLoadingPrice(true);
      try {
        if (activeChain === 'ethereum') {
          // Get proper addresses for native tokens
          const sellTokenAddress = sellToken.address === '0x0000000000000000000000000000000000001010' 
            ? NATIVE_TOKEN_ADDRESS 
            : sellToken.address;
          
          const buyTokenAddress = buyToken.address === '0x0000000000000000000000000000000000001010'
            ? NATIVE_TOKEN_ADDRESS
            : buyToken.address;

          const response = await axios.get(API_SWAP_PRICE_URL, {
            params: {
              chainId,
              sellToken: sellTokenAddress,
              buyToken: buyTokenAddress,
              sellAmount: parseUnits(sellAmount, sellToken.decimals).toString(),
              takerAddress: address,
              affiliateAddress: FEE_RECIPIENT,
              affiliateFee: AFFILIATE_FEE,
            }
          });
          setBuyAmount(formatUnits(response.data.buyAmount, buyToken.decimals));
        } else if (activeChain === 'solana') {
          // Solana price fetching logic
          const inputMint = getInputMint(sellToken.address);
          const outputMint = getOutputMint(buyToken.address);
          const amount = (parseFloat(sellAmount) * Math.pow(10, sellToken.decimals)).toString();
          
          const quoteResponse = await fetchJupiterQuote({
            inputMint,
            outputMint,
            amount,
            slippageBps: slippageTolerance,
          });
          
          if (quoteResponse.outAmount) {
            setBuyAmount(formatTokenAmount(quoteResponse.outAmount, buyToken.decimals));
          } else {
            throw new Error('Invalid quote response');
          }
        }
      } catch (error) {
        console.error('Error fetching quote:', error);
        setBuyAmount('');
        setSwapMessage(`Error fetching price: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setIsLoadingPrice(false);
      }
    } else {
      setBuyAmount('');
    }
  }, [sellToken, buyToken, sellAmount, slippageTolerance, activeChain, chainId, address]);

  const debouncedUpdateBuyAmount = useCallback(debounce(updateBuyAmount, 500), [updateBuyAmount]);

  useEffect(() => {
    debouncedUpdateBuyAmount();
    return () => debouncedUpdateBuyAmount.cancel();
  }, [sellToken, buyToken, sellAmount, debouncedUpdateBuyAmount]);

  const fetchSwapTransaction = async (quoteResponse: any) => {
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

  const sendTransactionWithRetry = async (connection: Connection, transaction: Transaction, signers: Keypair[], commitment: Commitment = 'confirmed') => {
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

  const handleConfirmSwap = async () => {
    try {
      if (!sellToken || !buyToken || !sellAmount) {
        throw new Error('Missing required swap parameters');
      }

      // Convert sell amount to proper units based on decimals
      const amountInBaseUnits = (Number(sellAmount) * Math.pow(10, sellToken.decimals)).toString();

      console.log('Fetching quote with params:', {
        inputMint: sellToken.address,
        outputMint: buyToken.address,
        amount: amountInBaseUnits
      });

      // Fetch quote first
      const quoteResponse = await fetchJupiterQuote({
        inputMint: sellToken.address,
        outputMint: buyToken.address,
        amount: amountInBaseUnits,
        slippageBps: '50'
      });

      if (!quoteResponse) {
        throw new Error('Failed to get quote');
      }

      console.log('Received quote:', quoteResponse);

      // Execute the swap with the quote
      const signature = await executeSolanaSwap(quoteResponse);
      console.log('Swap executed successfully:', signature);

      // Handle success
      setSwapStatus('success');
      setSwapTxSignature(signature);
      onClose(); // Close the confirmation modal

    } catch (error) {
      console.error('Swap execution failed:', error);
      setSwapStatus('error');
      setSwapError(error instanceof Error ? error.message : 'Unknown error occurred');
    }
  };

  const [transactionSignature, setTransactionSignature] = useState<string | null>(null);
  const [transactionStatus, setTransactionStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');

  const executeSolanaSwap = async (quoteResponse: any) => {
    try {
      // Validate required parameters
      if (!solanaWallet || !solanaWallet.publicKey) {
        throw new Error('Wallet not connected');
      }

      if (!quoteResponse) {
        throw new Error('Missing quote response');
      }

      // Check wallet and balance
      checkWalletReady();
      await checkBalance(solanaWallet);

      // Get a fresh quote with fixed 3% slippage
      const freshQuote = await fetchJupiterQuote({
        inputMint: quoteResponse.inputMint,
        outputMint: quoteResponse.outputMint,
        amount: Number(quoteResponse.inAmount),
        slippageBps: 300, // Fixed 3% slippage
        maxAccounts: 64
      });

      // Get latest blockhash before creating swap instructions
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');

      // Get swap instructions from Jupiter API
      const swapResponse = await fetchJupiterSwapInstructions({
        swapRequest: {
          quoteResponse: freshQuote,
          userPublicKey: solanaWallet.publicKey.toString(),
          wrapUnwrapSOL: true,
          computeUnitPriceMicroLamports: null,
          asLegacyTransaction: false,
          slippageBps: 300, // Fixed 3% slippage
          dynamicComputeUnitLimit: true,
          prioritizationFeeLamports: "auto"
        }
      });

      if (!swapResponse || !swapResponse.swapTransaction) {
        throw new Error('Failed to get swap transaction');
      }

      console.log('Received swap response:', swapResponse);

      // Decode the serialized transaction
      const swapTransactionBuf = Buffer.from(swapResponse.swapTransaction, 'base64');
      const transaction = VersionedTransaction.deserialize(swapTransactionBuf);

      // Update the transaction with fresh blockhash
      transaction.message.recentBlockhash = blockhash;

      // Sign the transaction
      if (!solanaWallet.signTransaction) {
        throw new Error('Wallet does not support transaction signing');
      }

      const signedTransaction = await solanaWallet.signTransaction(transaction);

      // Send transaction with retries
      const signature = await retry(
        async () => {
          const rawTransaction = signedTransaction.serialize();
          return await connection.sendRawTransaction(rawTransaction, {
            skipPreflight: true,
            maxRetries: 3,
            preflightCommitment: 'processed',
            minContextSlot: swapResponse.contextSlot,
            computeUnits: swapResponse.computeUnitLimit,
            prioritizationFee: swapResponse.prioritizationFeeLamports
          });
        },
        {
          retries: 5,
          minTimeout: 250,
          maxTimeout: 1000,
        }
      );

      console.log('Transaction sent:', signature);

      // Wait for transaction to be visible on the network
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Enhanced confirmation handling with more retries
      const confirmationResult = await retry(
        async () => {
          try {
            // First check transaction status with retries
            const statusCheckResult = await retry(
              async () => {
                const status = await connection.getSignatureStatus(signature, {
                  searchTransactionHistory: true
                });

                if (!status?.value) {
                  throw new Error('Status not found, retrying...');
                }

                return status;
              },
              {
                retries: 15,
                minTimeout: 2000,
                maxTimeout: 4000,
              }
            );

            if (statusCheckResult.value.err) {
              console.error('Transaction error:', statusCheckResult.value.err);
              throw new Error(`Transaction failed: ${JSON.stringify(statusCheckResult.value.err)}`);
            }

            // Get latest blockhash for confirmation
            const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');

            // Confirm transaction with new blockhash
            const confirmation = await connection.confirmTransaction({
              signature,
              blockhash,
              lastValidBlockHeight
            }, 'confirmed');

            if (confirmation.value.err) {
              throw new Error(`Transaction confirmation failed: ${confirmation.value.err}`);
            }

            // Additional verification with retries
            const txInfo = await retry(
              async () => {
                const info = await connection.getTransaction(signature, {
                  maxSupportedTransactionVersion: 0,
                  commitment: 'confirmed'
                });

                if (!info) {
                  throw new Error('Transaction info not found, retrying...');
                }

                return info;
              },
              {
                retries: 10,
                minTimeout: 1000,
                maxTimeout: 2000,
              }
            );

            // Check if transaction was successful
            if (txInfo.meta?.err) {
              throw new Error(`Transaction metadata shows error: ${JSON.stringify(txInfo.meta.err)}`);
            }

            return { statusCheckResult, confirmation, txInfo };
          } catch (error) {
            console.error('Confirmation error:', error);
            throw error;
          }
        },
        {
          retries: 10,
          minTimeout: 2000,
          maxTimeout: 4000,
        }
      );

      // If we get here, the transaction was successful
      console.log('Swap executed successfully:', signature);
      setTransactionSignature(signature);
      setSwapStatus('success');

      // Update UI with success message
      if (confirmationResult.txInfo?.meta) {
        const postTokenBalances = confirmationResult.txInfo.meta.postTokenBalances;
        console.log('Post-swap token balances:', postTokenBalances);
      }

      return signature;

    } catch (error) {
      console.error('Solana Swap Execution', error);
      setSwapStatus('error');
      if (error instanceof Error) {
        setSwapError(error.message);
        if ('getLogs' in error) {
          const logs = await (error as any).getLogs?.();
          console.error('Transaction logs:', logs);
        }
      }
      throw error;
    }
  };

  // Helper function to get address lookup table accounts
  const getAddressLookupTableAccounts = async (
    connection: Connection,
    keys: string[]
  ): Promise<AddressLookupTableAccount[]> => {
    const addressLookupTableAccountInfos = await connection.getMultipleAccountsInfo(
      keys.map((key) => new PublicKey(key))
    );

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
        if (signatureStatus.value.confirmationStatus === 'confirmed' || signatureStatus.value.confirmationStatus === 'finalized') {
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
              className="bg-transparent text-white text-2xl w-full outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
              className="bg-transparent text-white text-2xl w-full outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              placeholder="0"
              readOnly
            />
            {renderTokenSelector(buyToken, () => openTokenSelectModal('buy'))}
          </div>
        </div>
        <div className="flex justify-center">
          <button
            onClick={handleSwap}
            disabled={!isConnected || !sellToken || !buyToken || !sellAmount || swapStatus === 'loading'}
            className="bg-blue-500 text-white font-bold py-2 px-4 rounded"
          >
            {swapStatus === 'loading' ? 'Swapping...' : 'Swap'}
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
              className="bg-transparent text-white text-2xl w-full outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              placeholder="0"
            />
            {renderTokenSelector(sellToken, () => openTokenSelectModal('sell'))}
          </div>
        </div>
        <div className="flex justify-center mb-4">
          <div className="bg-gray-800 p-2 rounded-full cursor-pointer" onClick={swapTokens}>
            <ArrowUpDown className="h-6 w-6 text-gray-400" />
          </div>
        </div>
        <div className="mb-4">
          <div className="flex justify-between mb-2">
            <span className="text-gray-400">Buy</span>
          </div>
          <div className="flex items-center bg-gray-800 rounded-lg p-3">
            <input
              type="text"
              value={formatDisplayAmount(buyAmount, buyToken?.decimals || 6)}
              readOnly
              className="bg-transparent text-white text-2xl w-full outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              placeholder="0"
            />
            {renderTokenSelector(buyToken, () => openTokenSelectModal('buy'))}
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-400">Slippage Tolerance (%)</label>
          <input
            type="number"
            value={slippageTolerance / 100} // Convert basis points to percentage
            onChange={(e) => {
              const newValue = Math.max(0, Math.min(500, parseFloat(e.target.value) * 100));
              setSlippageTolerance(isNaN(newValue) ? DEFAULT_SLIPPAGE_BPS : newValue);
            }}
            className="mt-1 block w-full rounded-md bg-gray-800 border-gray-700 text-white"
            placeholder="5.0"
            min="0"
            max="5"
            step="0.1"
          />
        </div>
        <div className="flex justify-center">
          <button 
            onClick={handleSwapClick} 
            disabled={!solanaWallet.connected || !sellToken || !buyToken || !sellAmount || parseFloat(sellAmount) <= 0 || !buyAmount || parseFloat(buyAmount) <= 0 || transactionStatus === 'pending'}
            className={`w-full py-3 rounded-lg font-semibold ${
              (!solanaWallet.connected || !sellToken || !buyToken || !sellAmount || parseFloat(sellAmount) <= 0 || !buyAmount || parseFloat(buyAmount) <= 0 || transactionStatus === 'pending')
                ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {transactionStatus === 'pending' ? 'Swapping...' : 'Swap'}
          </button>
        </div>

        {transactionStatus !== 'idle' && (
          <div className="mt-4">
            <p className={
              transactionStatus === 'pending' ? 'text-yellow-500' :
              transactionStatus === 'success' ? 'text-green-500' : 'text-red-500'
            }>
              {swapMessage}
            </p>
            {transactionSignature && (
              <button
                onClick={() => window.open(`https://solscan.io/tx/${transactionSignature}`, '_blank')}
                className="mt-2 bg-blue-500 text-white px-4 py-2 rounded"
              >
                View Transaction
              </button>
            )}
          </div>
        )}
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
      setTokens(fetchedTokens);
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
          setTokens(solanaTokensList); // Use the same tokens state for both chains
        } else {
          console.log('Fetching EVM tokens...');
          const fetchedTokens = await fetchTokenList(chainId);
          console.log('Fetched EVM tokens:', fetchedTokens.length);
          setTokens(fetchedTokens);
        }
      } catch (error) {
        console.error('Error fetching tokens:', error);
        setError('Failed to fetch tokens');
      } finally {
        setIsLoadingTokens(false);
      }
    };

    fetchTokens();
  }, [chainId, activeChain]);

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
              <EthSlippageSettings slippage={ethSlippage} setSlippage={setEthSlippage} />
            </div>
          ) : (
            <div className="flex-grow bg-gray-900 rounded-lg">
              {renderSolanaSwapInterface()}
            </div>
          )}
        </div>
        {isTokenSelectModalOpen && (
          <TokenSelectModal
            tokens={activeChain === 'solana' ? solanaTokens : tokens}
            onClose={() => setIsTokenSelectModalOpen(false)}
            onSelect={handleTokenSelect}
            chainId={activeChain === 'solana' ? 'solana' : chainId}
            activeChain={activeChain}
            isLoading={isLoadingTokens}
            setShowTokenSelect={setShowTokenSelect}
          />
        )}
      </div>
      <SwapConfirmationModal
        isOpen={isConfirmationModalOpen}
        onClose={() => setIsConfirmationModalOpen(false)}
        onConfirm={handleConfirmSwap}
        sellAmount={sellAmount}
        buyAmount={buyAmount}
        sellToken={sellToken?.symbol || ''}
        buyToken={buyToken?.symbol || ''}
        slippage={DEFAULT_SLIPPAGE_BPS / 100}
        transactionSignature={transactionSignature}
      />
      {showTokenSelect && (
        <TokenSelectModal
          tokens={tokens}
          onClose={() => setShowTokenSelect(false)}
          onSelect={handleTokenSelect}
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
  );

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





































































































