'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Drawer } from 'vaul';
import useMeasure from 'react-use-measure';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Ban, BanknoteArrowDown, BanknoteArrowUp, Info, KeyboardMusic, Skull, Unplug, Wallet, X } from 'lucide-react';
import {
  ShieldIcon,
} from 'lucide-react';
import Image from 'next/image';
import { useAccount, useWalletClient, usePublicClient, useDisconnect, useConnect } from 'wagmi';
import { useDeposit, usePlayerDeposits, useTokenBalance, useTokenAllowance, useApproveToken, useApproveTokenMax } from '@/smartcontracthooks';
import { StatusL2Withdrawl, STT_TOKEN_ADDRESS } from '@/lib/contract';
import { parseUnits } from 'viem';
import { useUserBalance } from '@/hooks/useUserBalance';

interface WithdrawalHistory {
  _id: string
  amount: number
  status: 'pending' | 'completed' | 'rejected'
  requestedAt: string
  processedAt?: string
  transactionHash?: string
  rejectionReason?: string
}

interface WithdrawalData {
  withdrawals: WithdrawalHistory[]
  canWithdraw: boolean
  hoursRemaining: number
  lastWithdrawal?: WithdrawalHistory
}

export const AnimatedDrawer = () => {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const { balance: userBalanceFromHook, refetch: refetchUserBalance } = useUserBalance();
  const { connectors, connect, isPending } = useConnect();

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [view, setView] = useState('default');
  const [elementRef, bounds] = useMeasure();

  // Deposit state
  const [depositAmount, setDepositAmount] = useState('');
  const [depositError, setDepositError] = useState('');
  const [isProcessingDeposit, setIsProcessingDeposit] = useState(false);
  const depositAmountRef = useRef<string>('');
  const processedTxHashes = useRef<Set<string>>(new Set());

  // Withdraw state
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawError, setWithdrawError] = useState('');
  const [isProcessingWithdraw, setIsProcessingWithdraw] = useState(false);
  const [withdrawalData, setWithdrawalData] = useState<WithdrawalData | null>(null);
  const [isLoadingWithdrawalHistory, setIsLoadingWithdrawalHistory] = useState(false);

  // Notification state
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const { balance: tokenBalance, isLoading: isLoadingTokenBalance, refetch: refetchTokenBalance } = useTokenBalance();
  const walletBalance = tokenBalance ? Number(tokenBalance) : 0;
  const MIN_WITHDRAWAL_AMOUNT = 0.1;

  const { deposits: contractDeposits, refetch: refetchDeposits } = usePlayerDeposits();
  const { allowance, allowanceWei, isLoading: isLoadingAllowance, refetch: refetchAllowance } = useTokenAllowance();

  const formatAllowance = (allowanceStr: string, allowanceWei: bigint) => {
    const maxUint256 = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');
    if (allowanceWei >= maxUint256) {
      return 'Unlimited';
    }
    const num = parseFloat(allowanceStr);
    if (isNaN(num)) return '0';
    if (num >= 1000000) {
      return num.toLocaleString('en-US', { maximumFractionDigits: 2 });
    }
    return num.toLocaleString('en-US', { maximumFractionDigits: 4 });
  };

  const { approve, isPending: isApproving, isConfirmed: isApproveConfirmed } = useApproveToken({
    onSuccess: () => {
      refetchAllowance();
      setSuccessMessage('Token approval successful!');
      setTimeout(() => setSuccessMessage(''), 5000);
    },
    onError: (error) => {
      setErrorMessage(`Approval failed: ${error.message}`);
      setTimeout(() => setErrorMessage(''), 5000);
    },
  });

  const { approveMax, isPending: isApprovingMax, isConfirmed: isApproveMaxConfirmed } = useApproveTokenMax({
    onSuccess: () => {
      refetchAllowance();
      setSuccessMessage('Unlimited token approval successful!');
      setTimeout(() => setSuccessMessage(''), 5000);
    },
    onError: (error) => {
      setErrorMessage(`Approval failed: ${error.message}`);
      setTimeout(() => setErrorMessage(''), 5000);
    },
  });

  const fetchWithdrawalHistory = useCallback(async () => {
    if (!address) return;
    setIsLoadingWithdrawalHistory(true);
    try {
      const response = await fetch(`/api/withdraw?walletAddress=${address}`);
      if (response.ok) {
        const data = await response.json();
        setWithdrawalData(data);
      }
    } catch (error) {
      console.error('Failed to fetch withdrawal history:', error);
    } finally {
      setIsLoadingWithdrawalHistory(false);
    }
  }, [address]);

  // Refetch balance whenever drawer opens
  useEffect(() => {
    if (isOpen) {
      refetchUserBalance();
      refetchTokenBalance();
      if (view === 'withdraw') {
        fetchWithdrawalHistory();
      }
    }
  }, [isOpen, view, refetchUserBalance, refetchTokenBalance, fetchWithdrawalHistory]);

  // Also listen for balance updates from games
  useEffect(() => {
    const handleBalanceUpdate = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      console.log('AnimatedDrawer - Balance update event received:', detail);
      console.log('AnimatedDrawer - Current balance before refetch:', userBalanceFromHook);
      refetchUserBalance();
    };

    window.addEventListener('balanceUpdated', handleBalanceUpdate);
    window.addEventListener('betPlaced', handleBalanceUpdate);
    window.addEventListener('cashoutCompleted', handleBalanceUpdate);

    return () => {
      window.removeEventListener('balanceUpdated', handleBalanceUpdate);
      window.removeEventListener('betPlaced', handleBalanceUpdate);
      window.removeEventListener('cashoutCompleted', handleBalanceUpdate);
    };
  }, [refetchUserBalance, userBalanceFromHook]);

  const { deposit, isLoading: isDepositing, isConfirmed, amountNeedsApproval } = useDeposit({
    onSuccess: async (txHash) => {
      if (processedTxHashes.current.has(txHash)) {
        return;
      }
      processedTxHashes.current.add(txHash);
      const amount = depositAmountRef.current;
      if (!amount || parseFloat(amount) <= 0) {
        setDepositError('Invalid deposit amount. Please try again.');
        return;
      }
      try {
        setIsProcessingDeposit(true);
        const response = await fetch('/api/deposit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            walletAddress: address,
            amount,
            transactionHash: txHash,
          }),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to save deposit');
        }
        setDepositAmount('');
        depositAmountRef.current = '';
        refetchDeposits();
        window.dispatchEvent(new CustomEvent('depositCompleted'));
        window.dispatchEvent(new CustomEvent('balanceUpdated'));
        setSuccessMessage(`Deposit successful! ${amount} MCS`);
        setTimeout(() => {
          setSuccessMessage('');
          setView('default');
        }, 3000);
      } catch (error) {
        setErrorMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setTimeout(() => setErrorMessage(''), 5000);
      } finally {
        setIsProcessingDeposit(false);
      }
    },
    onError: (error) => {
      setDepositError(error.message);
      setIsProcessingDeposit(false);
      setTimeout(() => setDepositError(''), 5000);
    },
  });

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      setDepositError('Please enter a valid amount');
      setTimeout(() => setDepositError(''), 3000);
      return;
    }
    if (!address) {
      setDepositError('Please connect wallet');
      setTimeout(() => setDepositError(''), 3000);
      return;
    }
    if (parseFloat(depositAmount) > walletBalance) {
      setDepositError('Insufficient MCS tokens');
      setTimeout(() => setDepositError(''), 3000);
      return;
    }
    if (amountNeedsApproval && amountNeedsApproval(depositAmount)) {
      setDepositError('Please approve tokens first');
      setTimeout(() => setDepositError(''), 3000);
      return;
    }
    setDepositError('');
    depositAmountRef.current = depositAmount;
    try {
      await deposit(depositAmount);
    } catch (error) {
      if (error instanceof Error && error.message.includes('allowance')) {
        setDepositError('Insufficient token allowance');
        setTimeout(() => setDepositError(''), 3000);
      }
    }
  };

  const handleApprove = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      setDepositError('Please enter amount first');
      return;
    }
    try {
      await approve(depositAmount);
    } catch (error) {
      console.error('Approval error:', error);
    }
  };

  const handleApproveMax = async () => {
    try {
      await approveMax();
    } catch (error) {
      console.error('Approval error:', error);
    }
  };

  const handleDepositAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAmount = e.target.value;
    setDepositAmount(newAmount);
    if (newAmount && !isLoadingTokenBalance) {
      const amountNum = parseFloat(newAmount);
      if (isNaN(amountNum) || amountNum <= 0) {
        setDepositError('Amount must be greater than 0');
      } else if (amountNum > walletBalance) {
        setDepositError('You do not have enough MCS tokens');
      } else {
        setDepositError('');
      }
    } else {
      setDepositError('');
    }
  };

  const handleWithdrawAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAmount = e.target.value;
    setWithdrawAmount(newAmount);
    if (newAmount) {
      const amountNum = parseFloat(newAmount);
      if (isNaN(amountNum) || amountNum <= 0) {
        setWithdrawError('Amount must be greater than 0');
      } else if (amountNum < MIN_WITHDRAWAL_AMOUNT) {
        setWithdrawError(`Minimum withdrawal is ${MIN_WITHDRAWAL_AMOUNT} MCS`);
      } else if (amountNum > userBalanceFromHook) {
        setWithdrawError('Insufficient balance');
      } else {
        setWithdrawError('');
      }
    } else {
      setWithdrawError('');
    }
  };

  const handleWithdraw = async () => {
    if (!address || !withdrawAmount) {
      setWithdrawError('Please enter a valid amount');
      return;
    }
    if (!walletClient || !publicClient) {
      setWithdrawError('Wallet not ready');
      return;
    }
    const amount = parseFloat(withdrawAmount);
    if (amount < MIN_WITHDRAWAL_AMOUNT) {
      setWithdrawError(`Minimum withdrawal is ${MIN_WITHDRAWAL_AMOUNT} MCS`);
      return;
    }
    if (amount > userBalanceFromHook) {
      setWithdrawError('Insufficient balance');
      return;
    }
    if (!withdrawalData?.canWithdraw) {
      setWithdrawError(`Wait ${withdrawalData?.hoursRemaining ?? 0} more hour(s)`);
      return;
    }

    setIsProcessingWithdraw(true);
    setWithdrawError('');
    try {
      const response = await fetch('/api/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: address, amount }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to process withdrawal');
      }

      try {
        const amountInWei = parseUnits(amount.toString(), 18);
        const txHash = await walletClient.writeContract({
          address: StatusL2Withdrawl.contractAddress as `0x${string}`,
          abi: StatusL2Withdrawl.abi,
          functionName: 'claimWithdrawal',
          args: [
            STT_TOKEN_ADDRESS as `0x${string}`,
            amountInWei,
            BigInt(result.nonce),
            result.signature as `0x${string}`,
          ],
        });

        const receipt = await publicClient.waitForTransactionReceipt({
          hash: txHash,
          timeout: 60_000,
        });

        if (receipt.status !== 'success') {
          throw new Error('Transaction failed');
        }

        try {
          await fetch('/api/withdraw/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              withdrawalId: result.withdrawalId,
              walletAddress: address,
              transactionHash: txHash,
              status: 'completed',
            }),
          });
        } catch (markErr) {
          console.error('Failed to mark as completed:', markErr);
        }

        window.dispatchEvent(new CustomEvent('balanceUpdated'));
        setSuccessMessage(`Withdrawal successful! ${amount} MCS`);
        setTimeout(() => {
          setSuccessMessage('');
          setView('default');
        }, 3000);
      } catch (contractError: any) {
        console.error('Contract withdrawal failed:', contractError);
        setWithdrawError(contractError?.message || 'Failed to complete withdrawal');
        return;
      }
    } catch (error) {
      console.error('Withdrawal failed:', error);
      setWithdrawError(error instanceof Error ? error.message : 'Failed to process');
    } finally {
      setIsProcessingWithdraw(false);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setIsOpen(false);
    setView('default');
  };

  const setQuickAmount = (amount: number) => {
    setDepositAmount(amount.toString());
  };

  const setWithdrawPercentage = (percentage: number) => {
    const amount = (userBalanceFromHook * percentage) / 100;
    setWithdrawAmount(amount.toFixed(4));
  };

  const content = useMemo(() => {
    switch (view) {
      case 'default':
        return (
          <div className="">
            <div className="flex items-center justify-between w-full">
              <h2 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">Wallet Settings</h2>
              <Button
                variant="secondary"
                size="icon"
                className="rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
                onClick={() => setIsOpen(false)}
              >
                <X className="text-neutral-600 dark:text-neutral-400" size="18" />
              </Button>
            </div>

            <div className="mt-6 flex flex-col items-start gap-4">
              <button
                className="bg-neutral-100 relative dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-900 dark:text-neutral-100 font-medium flex items-center gap-2 w-full rounded-2xl px-4 py-3.5 transition-colors"
              >
                <div className="w-6 h-6">
                  <Image src="/impAssets/Chip.webp" alt="Chips" width={20} height={20} className='w-full h-full object-cover' />
                </div>
                <span className='bg-neutral-100 px-2 rounded-xs dark:bg-neutral-800 absolute text-sm -top-3 left-6 z-10'>Game Balance</span>
                {userBalanceFromHook.toFixed(2)} MCS
              </button>
              <div className='flex w-full gap-4 justify-between'>
                <button
                  onClick={() => setView('deposit')}
                  className="bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-900 dark:text-neutral-100 font-medium flex items-center gap-2 w-full rounded-2xl px-4 py-3.5 transition-colors"
                >
                  <BanknoteArrowUp />
                  Deposit
                </button>
                <button
                  onClick={() => setView('withdraw')}
                  className="bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-900 dark:text-neutral-100 font-medium flex items-center gap-2 w-full rounded-2xl px-4 py-3.5 transition-colors"
                >
                  <BanknoteArrowDown />
                  Withdraw
                </button>
              </div>
              <button
                onClick={() => setView('remove')}
                className="bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 font-medium flex items-center gap-2 w-full rounded-2xl px-4 py-3.5 transition-colors"
              >
                <Unplug />
                Disconnect
              </button>
            </div>

            {successMessage && (
              <div className="mt-4 p-3 bg-green-500/20 border border-green-400/30 rounded-lg text-green-600 dark:text-green-400 text-sm">
                ✅ {successMessage}
              </div>
            )}
            {errorMessage && (
              <div className="mt-4 p-3 bg-red-500/20 border border-red-400/30 rounded-lg text-red-600 dark:text-red-400 text-sm">
                ❌ {errorMessage}
              </div>
            )}
          </div>
        );
      case 'remove':
        return (
          <div className="space-y-4">
            <div className="flex justify-between ">
              <Skull />
              <Button
                variant="secondary"
                size="icon"
                className="rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
                onClick={() => setIsOpen(false)}
              >
                <X className="text-neutral-600 dark:text-neutral-400" size="18" />
              </Button>
            </div>
            <h2 className="font-medium text-xl text-neutral-900 dark:text-neutral-100">Wait, disconnect? Already?</h2>

            <p className="text-neutral-500 dark:text-neutral-400 font-light text-lg">
              There's still so much fun left in the game. Don't leave the adventure unfinished.
            </p>
            <div className="flex items-center gap-4 justify-start overflow-hidden">
              <Button
                onClick={() => setView('default')}
                className="py-6 px-6 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-900 dark:text-neutral-100 rounded-3xl text-md transition-colors"
              >
                Stay & Play
              </Button>
              <Button
                onClick={handleDisconnect}
                className="py-6 px-6 bg-red-500 hover:bg-red-600 text-white rounded-3xl text-md transition-colors"
              >
                Disconnect
              </Button>
            </div>
          </div>
        );
      case 'deposit':
        return (
          <div className="space-y-4">
            <div className="flex justify-between">
              <BanknoteArrowUp />
              <Button
                variant="secondary"
                size="icon"
                className="rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
                onClick={() => setIsOpen(false)}
              >
                <X className="text-neutral-600 dark:text-neutral-400" size="18" />
              </Button>
            </div>
            <h2 className="font-medium text-xl text-neutral-900 dark:text-neutral-100">Chip In</h2>
            <div className="border-t border-neutral-200 dark:border-neutral-700 space-y-5 text-neutral-500 dark:text-neutral-400 text-lg">
              <div className="flex items-center gap-4 mt-5">
                <Info />
                <h3>Wallet: {isLoadingTokenBalance ? 'Loading...' : walletBalance.toFixed(4)} MCS</h3>
              </div>
              <div>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={handleDepositAmountChange}
                  placeholder="Enter amount"
                  className='w-full rounded-2xl px-4 py-3 text-neutral-900 dark:text-neutral-100 font-bold placeholder:font-medium placeholder:text-neutral-400 dark:placeholder:text-neutral-400 transition-colors border border-neutral-200 dark:border-neutral-700'
                />
                {depositError && <p className="text-red-500 text-sm mt-2">{depositError}</p>}
                <div className='flex w-full gap-2 mt-2'>
                  <div onClick={() => setQuickAmount(10)} className='bg-neutral-100 cursor-pointer w-full text-center dark:bg-neutral-800 rounded-2xl py-2 text-neutral-900 dark:text-neutral-100 font-medium hover:bg-neutral-200 dark:hover:bg-neutral-700'>10</div>
                  <div onClick={() => setQuickAmount(20)} className='bg-neutral-100 cursor-pointer w-full text-center dark:bg-neutral-800 rounded-2xl py-2 text-neutral-900 dark:text-neutral-100 font-medium hover:bg-neutral-200 dark:hover:bg-neutral-700'>20</div>
                  <div onClick={() => setQuickAmount(50)} className='bg-neutral-100 cursor-pointer w-full text-center dark:bg-neutral-800 rounded-2xl py-2 text-neutral-900 dark:text-neutral-100 font-medium hover:bg-neutral-200 dark:hover:bg-neutral-700'>50</div>
                  <div onClick={() => setQuickAmount(100)} className='bg-neutral-100 cursor-pointer w-full text-center dark:bg-neutral-800 rounded-2xl py-2 text-neutral-900 dark:text-neutral-100 font-medium hover:bg-neutral-200 dark:hover:bg-neutral-700'>100</div>
                </div>
              </div>

              {depositAmount && parseFloat(depositAmount) > 0 && !isLoadingAllowance && amountNeedsApproval && amountNeedsApproval(depositAmount) && (
                <div className="p-3 rounded-lg bg-yellow-500/20 border border-yellow-400/30 text-yellow-600 dark:text-yellow-400 text-sm">
                  ⚠️ Approval required
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={handleApprove}
                      disabled={isApproving || isApprovingMax}
                      className="flex-1 py-2 px-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 text-sm"
                    >
                      {isApproving ? 'Approving...' : 'Approve'}
                    </button>
                    <button
                      onClick={handleApproveMax}
                      disabled={isApproving || isApprovingMax}
                      className="flex-1 py-2 px-3 bg-yellow-700 text-white rounded-lg hover:bg-yellow-800 disabled:opacity-50 text-sm"
                    >
                      {isApprovingMax ? 'Approving...' : 'Unlimited'}
                    </button>
                  </div>
                  {(isApproveConfirmed || isApproveMaxConfirmed) && (
                    <p className="text-sm text-green-600 dark:text-green-400 mt-2">✅ Approved!</p>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center justify-start gap-4">
              <Button
                onClick={() => setView('default')}
                className="p-6 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-900 dark:text-neutral-100 rounded-3xl text-lg transition-colors"
              >
                Back
              </Button>
              <Button
                onClick={handleDeposit}
                disabled={!depositAmount || !!depositError || isDepositing || isProcessingDeposit || (amountNeedsApproval && amountNeedsApproval(depositAmount))}
                className="p-6 bg-sky-400 hover:bg-sky-500 text-white rounded-3xl text-lg flex items-center gap-3 transition-colors disabled:opacity-50"
              >
                <Image src="/impAssets/Chip.webp" alt="coin" width={24} height={24} />
                {isDepositing ? 'Depositing...' : isProcessingDeposit ? 'Saving...' : 'Chip In'}
              </Button>
            </div>
          </div>
        );
      case 'withdraw':
        return (
          <div className="space-y-4">
            <div className="flex justify-between">
              <BanknoteArrowDown />
              <Button
                variant="secondary"
                size="icon"
                className="rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
                onClick={() => setIsOpen(false)}
              >
                <X className="text-neutral-600 dark:text-neutral-400" size="18" />
              </Button>
            </div>
            <h2 className="font-medium text-xl text-neutral-900 dark:text-neutral-100">Chip Out</h2>
            <div className="border-t border-neutral-200 dark:border-neutral-700 space-y-5 text-neutral-500 dark:text-neutral-400 text-lg">
              <div className="flex items-center gap-4 mt-5">
                <Info />
                <h3>Balance: {userBalanceFromHook.toFixed(4)} MCS</h3>
              </div>
              {!isLoadingWithdrawalHistory && withdrawalData && !withdrawalData.canWithdraw && (
                <div className="p-3 rounded-lg bg-yellow-500/20 border border-yellow-400/30 text-yellow-600 dark:text-yellow-400 text-sm">
                  ⏱️ Wait {withdrawalData.hoursRemaining} more hour(s)
                </div>
              )}
              <div>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={handleWithdrawAmountChange}
                  placeholder="Enter amount"
                  disabled={Boolean(withdrawalData && !withdrawalData.canWithdraw)}
                  className='w-full rounded-2xl px-4 py-3 text-neutral-900 dark:text-neutral-100 font-bold placeholder:font-medium placeholder:text-neutral-400 dark:placeholder:text-neutral-400 transition-colors border border-neutral-200 dark:border-neutral-700 disabled:opacity-50'
                />
                {withdrawError && <p className="text-red-500 text-sm mt-2">{withdrawError}</p>}
                <div className='flex w-full gap-2 mt-2'>
                  <div onClick={() => setWithdrawPercentage(50)} className='bg-neutral-100 cursor-pointer w-full text-center dark:bg-neutral-800 rounded-2xl py-2 text-neutral-900 dark:text-neutral-100 font-medium hover:bg-neutral-200 dark:hover:bg-neutral-700'>50 %</div>
                  <div onClick={() => setWithdrawPercentage(100)} className='bg-neutral-100 cursor-pointer w-full text-center dark:bg-neutral-800 rounded-2xl py-2 text-neutral-900 dark:text-neutral-100 font-medium hover:bg-neutral-200 dark:hover:bg-neutral-700'>100 %</div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-start gap-4">
              <Button
                onClick={() => setView('default')}
                className="p-6 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-900 dark:text-neutral-100 rounded-3xl text-lg transition-colors"
              >
                Back
              </Button>
              <Button
                onClick={handleWithdraw}
                disabled={Boolean(!withdrawAmount || !!withdrawError || isProcessingWithdraw || (withdrawalData && !withdrawalData.canWithdraw))}
                className="p-6 bg-sky-400 hover:bg-sky-500 text-white rounded-3xl text-lg flex items-center gap-3 transition-colors disabled:opacity-50"
              >
                <Image src="/impAssets/Chip.webp" alt="coin" width={24} height={24} />
                {isProcessingWithdraw ? 'Processing...' : 'Chip Out'}
              </Button>
            </div>
          </div>
        );
    }
  }, [view, depositAmount, depositError, withdrawAmount, withdrawError, isDepositing, isProcessingDeposit, isProcessingWithdraw, walletBalance, isLoadingTokenBalance, userBalanceFromHook, withdrawalData, isLoadingWithdrawalHistory, contractDeposits, successMessage, errorMessage, isApproving, isApprovingMax, isApproveConfirmed, isApproveMaxConfirmed, amountNeedsApproval, isLoadingAllowance]);

  const handleButtonClick = () => {
    if (!isConnected) {
      // Connect wallet using Reown connector (first connector)
      connect({ connector: connectors[0] });
    } else {
      // Wallet is connected, open the drawer
      setIsOpen(true);
    }
  };

  return (
    <>
      <Button
        className="mt-5 px-6 rounded-md bg-white dark:bg-neutral-800 py-2 font-medium text-black dark:text-white border border-neutral-200 dark:border-neutral-700 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-700 focus-visible:shadow-focus-ring-button md:font-medium"
        onClick={handleButtonClick}
        disabled={isPending}
      >
        {isPending ? 'Connecting...' : isConnected ? <Wallet /> : 'Connect Wallet'}
      </Button>
      {isConnected && (
        <Drawer.Root open={isOpen} onOpenChange={setIsOpen}>
          <Drawer.Portal>
            <Drawer.Overlay className="fixed inset-0 bg-black/40" onClick={() => setIsOpen(false)} />
            <Drawer.Content
              asChild
              className="fixed inset-x-4 bottom-4 z-10 mx-auto h-64 max-w-[361px] overflow-hidden rounded-[36px] bg-white dark:bg-neutral-900 outline-none md:mx-auto md:w-full"
            >
              <motion.div animate={{ height: bounds.height }}>
                <div className="p-6" ref={elementRef}>
                  {content}
                </div>
              </motion.div>
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>
      )}
    </>
  );
};
