import React, { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAccount, useBalance } from 'wagmi'
import { statusNetworkSepolia } from 'viem/chains'
import { formatEther } from 'viem'
import { useDeposit, usePlayerDeposits } from '../../smartcontracthooks'

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

type TabValue = 'deposit' | 'withdraw'

export function DepositButton() {
  const { address } = useAccount()

  const [activeTab, setActiveTab] = useState<TabValue>('deposit')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // Deposit state
  const [depositAmount, setDepositAmount] = useState('')
  const [depositError, setDepositError] = useState('')
  const [isProcessingDeposit, setIsProcessingDeposit] = useState(false)
  const depositAmountRef = useRef<string>('')
  const processedTxHashes = useRef<Set<string>>(new Set())

  // Withdraw state
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawError, setWithdrawError] = useState('')
  const [isProcessingWithdraw, setIsProcessingWithdraw] = useState(false)
  const [withdrawalData, setWithdrawalData] = useState<WithdrawalData | null>(null)
  const [isLoadingWithdrawalHistory, setIsLoadingWithdrawalHistory] = useState(false)
  const [isLoadingUserBalance, setIsLoadingUserBalance] = useState(false)
  const [userBalance, setUserBalance] = useState<number>(0)

  const { data: balance, isLoading } = useBalance({
    address,
    chainId: statusNetworkSepolia.id,
  })

  const walletBalance = balance ? Number(formatEther(balance.value)) : 0
  const MIN_WITHDRAWAL_AMOUNT = 0.1

  const { deposits: contractDeposits, refetch: refetchDeposits } = usePlayerDeposits()

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const fetchUserBalance = useCallback(async () => {
    if (!address) return
    setIsLoadingUserBalance(true)
    try {
      const response = await fetch(`/api/user-balance?walletAddress=${address}`)
      if (response.ok) {
        const data = await response.json()
        setUserBalance(data.user?.balance || 0)
      }
    } catch (error) {
      console.error('Failed to fetch user balance:', error)
    } finally {
      setIsLoadingUserBalance(false)
    }
  }, [address])

  const fetchWithdrawalHistory = useCallback(async () => {
    if (!address) return
    setIsLoadingWithdrawalHistory(true)
    try {
      const response = await fetch(`/api/withdraw?walletAddress=${address}`)
      if (response.ok) {
        const data = await response.json()
        setWithdrawalData(data)
      }
    } catch (error) {
      console.error('Failed to fetch withdrawal history:', error)
    } finally {
      setIsLoadingWithdrawalHistory(false)
    }
  }, [address])

  useEffect(() => {
    if (isModalOpen && activeTab === 'withdraw') {
      fetchUserBalance()
      fetchWithdrawalHistory()
    }
  }, [isModalOpen, activeTab, fetchUserBalance, fetchWithdrawalHistory])

  const { deposit, isLoading: isDepositing, isConfirmed } = useDeposit({
    onSuccess: async (txHash) => {
      if (processedTxHashes.current.has(txHash)) {
        return
      }
      processedTxHashes.current.add(txHash)
      const amount = depositAmountRef.current
      if (!amount || parseFloat(amount) <= 0) {
        alert('Invalid deposit amount. Please try again.')
        return
      }
      try {
        setIsProcessingDeposit(true)
        const requestData = {
          walletAddress: address,
          amount,
          transactionHash: txHash,
        }
        const response = await fetch('/api/deposit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestData),
        })
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to save deposit to database')
        }
        await response.json()
        setDepositAmount('')
        depositAmountRef.current = ''
        refetchDeposits()
        window.dispatchEvent(new CustomEvent('depositCompleted'))
        window.dispatchEvent(new CustomEvent('balanceUpdated'))
        alert(`🎉 Deposit successful!\n💰 Amount: ${amount} STT\n🔗 Transaction: ${txHash.slice(0, 10)}...`)
        setIsModalOpen(false)
      } catch (error) {
        alert(`Deposit to smart contract succeeded, but failed to save to database: ${error instanceof Error ? error.message : 'Unknown error'}`)
      } finally {
        setIsProcessingDeposit(false)
      }
    },
    onError: (error) => {
      alert(`Deposit failed: ${error.message}`)
      setIsProcessingDeposit(false)
    },
  })

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      setDepositError('Please enter a valid amount')
      return
    }
    if (!address) {
      alert('Please connect your wallet first')
      return
    }
    if (balance && parseFloat(depositAmount) > walletBalance) {
      setDepositError('You do not have enough monad')
      return
    }
    setDepositError('')
    depositAmountRef.current = depositAmount
    await deposit(depositAmount)
  }

  const handleWithdraw = async () => {
    if (!address || !withdrawAmount) {
      setWithdrawError('Please enter a valid amount')
      return
    }

    const amount = parseFloat(withdrawAmount)
    if (amount < MIN_WITHDRAWAL_AMOUNT) {
      setWithdrawError(`Minimum withdrawal is ${MIN_WITHDRAWAL_AMOUNT} STT`)
      return
    }
    if (amount > userBalance) {
      setWithdrawError('Insufficient balance')
      return
    }
    if (!withdrawalData?.canWithdraw) {
      setWithdrawError(`You can only withdraw once per 24 hours. Please wait ${withdrawalData?.hoursRemaining ?? 0} more hour(s).`)
      return
    }

    setIsProcessingWithdraw(true)
    setWithdrawError('')
    try {
      const response = await fetch('/api/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: address,
          amount,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to process withdrawal')
      }

      window.dispatchEvent(new CustomEvent('balanceUpdated'))

      alert(`✅ Withdrawal request submitted!\n💰 Amount: ${amount} STT\n📊 New Balance: ${result.newBalance} STT\n⏱️ Estimated processing: ${result.estimatedProcessingTime}\n\nYour balance has been deducted immediately.`)

      setIsModalOpen(false)
    } catch (error) {
      console.error('Withdrawal failed:', error)
      setWithdrawError(error instanceof Error ? error.message : 'Failed to process withdrawal')
    } finally {
      setIsProcessingWithdraw(false)
    }
  }

  const handleDepositAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAmount = e.target.value
    setDepositAmount(newAmount)
    if (newAmount && !isLoading && balance) {
      const amountNum = parseFloat(newAmount)
      if (isNaN(amountNum) || amountNum <= 0) {
        setDepositError('Amount must be greater than 0')
      } else if (amountNum > walletBalance) {
        setDepositError('You do not have enough monad')
      } else {
        setDepositError('')
      }
    } else {
      setDepositError('')
    }
  }

  const handleWithdrawAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAmount = e.target.value
    setWithdrawAmount(newAmount)
    if (newAmount) {
      const amountNum = parseFloat(newAmount)
      if (isNaN(amountNum) || amountNum <= 0) {
        setWithdrawError('Amount must be greater than 0')
      } else if (amountNum < MIN_WITHDRAWAL_AMOUNT) {
        setWithdrawError(`Minimum withdrawal is ${MIN_WITHDRAWAL_AMOUNT} STT`)
      } else if (amountNum > userBalance) {
        setWithdrawError('Insufficient balance')
      } else {
        setWithdrawError('')
      }
    } else {
      setWithdrawError('')
    }
  }

  const openModal = () => {
    if (!address) {
      alert('Please connect your wallet first')
      return
    }
    setActiveTab('deposit')
    setDepositAmount('')
    setWithdrawAmount('')
    setDepositError('')
    setWithdrawError('')
    setIsProcessingDeposit(false)
    setIsProcessingWithdraw(false)
    depositAmountRef.current = ''
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setDepositAmount('')
    setWithdrawAmount('')
    setDepositError('')
    setWithdrawError('')
    setIsProcessingDeposit(false)
    setIsProcessingWithdraw(false)
    depositAmountRef.current = ''
  }

  return (
    <>
      <button
        onClick={openModal}
        className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
      >
        Deposit / Withdraw STT
      </button>
      {isModalOpen && isMounted && createPortal(
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
          onClick={closeModal}
        >
          <div
            className="rounded-xl p-6 w-full max-w-xl mx-4 shadow-2xl relative border border-white/20 bg-[#240B53] backdrop-blur-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="text-sm text-white/60">Wallet actions</p>
                <h2 className="text-2xl font-semibold text-white">
                  {activeTab === 'deposit' ? 'Deposit STT' : 'Withdraw STT'}
                </h2>
              </div>
              <button
                onClick={closeModal}
                className="text-white hover:text-gray-300 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
                aria-label="Close modal"
              >
                ×
              </button>
            </div>


            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabValue)} className='w-full'>
              <TabsList className="grid grid-cols-2 bg-white/10 border border-white/20 text-white">
                <TabsTrigger
                  value="deposit"
                  className="data-[state=active]:bg-white/20 data-[state=active]:text-white"
                >
                  Deposit
                </TabsTrigger>
                <TabsTrigger
                  value="withdraw"
                  className="data-[state=active]:bg-white/20 data-[state=active]:text-white"
                >
                  Withdraw
                </TabsTrigger>
              </TabsList>

              <TabsContent value="deposit" className="mt-6 space-y-4 text-white">
                <div className="p-4 rounded-lg bg-white/10 border border-white/20 flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-white/60 mb-1">Current Deposits</p>
                    <p className="text-lg font-semibold text-white">{contractDeposits} STT</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-wide text-white/60 mb-1">Wallet Balance</p>
                    <p className="text-lg font-mono text-white">
                      {balance ? Number(formatEther(balance.value)).toFixed(4) : '0.0000'}
                    </p>
                  </div>
                </div>

                <div>
                  <label htmlFor="deposit-amount" className="block text-sm text-white/80 mb-2">
                    Amount
                  </label>
                  <input
                    id="deposit-amount"
                    type="number"
                    value={depositAmount}
                    onChange={handleDepositAmountChange}
                    placeholder="0.0"
                    step="0.001"
                    min="0"
                    className={`w-full px-3 py-2.5 border rounded-lg bg-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 ${
                      depositError ? 'border-red-500/50 focus:ring-red-500' : 'border-white/20 focus:ring-white/50'
                    }`}
                    disabled={isDepositing || isProcessingDeposit || isLoading}
                  />
                  {depositError && (
                    <p className="mt-2 text-sm text-red-400">{depositError}</p>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={closeModal}
                    className="flex-1 py-2.5 px-4 border border-white/20 text-white rounded-lg hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeposit}
                    disabled={Boolean(
                      isDepositing ||
                      isProcessingDeposit ||
                      !depositAmount ||
                      !!depositError ||
                      isLoading ||
                      (depositAmount && parseFloat(depositAmount) > walletBalance)
                    )}
                    className="flex-1 py-2.5 px-4 bg-white text-[#240B53] rounded-lg hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                  >
                    {isDepositing ? 'Depositing...' : isProcessingDeposit ? 'Saving...' : 'Deposit'}
                  </button>
                </div>

                {isConfirmed && isProcessingDeposit && (
                  <p className="text-green-400 text-sm text-center">
                    ✅ Smart contract deposit confirmed! Saving to database...
                  </p>
                )}
                {isProcessingDeposit && !isConfirmed && (
                  <p className="text-blue-400 text-sm text-center">
                    💾 Saving deposit to database...
                  </p>
                )}
              </TabsContent>

              <TabsContent value="withdraw" className="mt-6 max-h-[40vh] overflow-y-auto space-y-4 text-white">
                <div className="p-4 rounded-lg bg-white/10 border border-white/20 flex flex-col gap-1">
                  <p className="text-xs uppercase tracking-wide text-white/60 mb-1">Available Balance</p>
                  {isLoadingUserBalance ? (
                    <p className="text-lg font-semibold text-white/40">Loading...</p>
                  ) : (
                    <p className="text-lg font-semibold text-white">{userBalance.toFixed(4)} STT</p>
                  )}
                  <p className="text-xs text-white/60 mt-1">Minimum withdrawal {MIN_WITHDRAWAL_AMOUNT} STT</p>
                </div>

                {!isLoadingWithdrawalHistory && withdrawalData && !withdrawalData.canWithdraw && (
                  <div className="p-3 rounded-lg bg-yellow-500/20 border border-yellow-400/30 text-yellow-100 text-sm">
                    ⏱️ You can only withdraw once per 24 hours. Please wait {withdrawalData.hoursRemaining} more hour(s).
                  </div>
                )}

                <div>
                  <label htmlFor="withdraw-amount" className="block text-sm text-white/80 mb-2">
                    Amount
                  </label>
                  <input
                    id="withdraw-amount"
                    type="number"
                    value={withdrawAmount}
                    onChange={handleWithdrawAmountChange}
                    placeholder="0.0"
                    step="0.001"
                    min={MIN_WITHDRAWAL_AMOUNT}
                    className={`w-full px-3 py-2.5 border rounded-lg bg-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 ${
                      withdrawError ? 'border-red-500/50 focus:ring-red-500' : 'border-white/20 focus:ring-white/50'
                    }`}
                    disabled={Boolean(isProcessingWithdraw || isLoadingWithdrawalHistory || (withdrawalData && !withdrawalData.canWithdraw))}
                  />
                  {withdrawError && (
                    <p className="mt-2 text-sm text-red-400">{withdrawError}</p>
                  )}
                </div>

                <div className="p-3 rounded-lg bg-blue-500/20 border border-blue-400/30 text-xs text-blue-100">
                  ⚠️ Your balance will be deducted immediately upon request. Withdrawals are processed within 24-48 hours.
                </div>

                {withdrawalData && withdrawalData.withdrawals.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Recent Withdrawals</p>
                    <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                      {withdrawalData.withdrawals.slice(0, 3).map((w) => (
                        <div key={w._id} className="p-2.5 bg-white/10 rounded-lg text-xs border border-white/20">
                          <div className="flex justify-between items-center">
                            <span className="text-white font-medium">{w.amount.toFixed(4)} STT</span>
                            <span
                              className={`px-2 py-0.5 rounded capitalize text-xs ${
                                w.status === 'completed'
                                  ? 'bg-green-500/20 text-green-300'
                                  : w.status === 'pending'
                                  ? 'bg-yellow-500/20 text-yellow-200'
                                  : 'bg-red-500/20 text-red-300'
                              }`}
                            >
                              {w.status}
                            </span>
                          </div>
                          <p className="text-white/60 mt-1">
                            {new Date(w.requestedAt).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={closeModal}
                    className="flex-1 py-2.5 px-4 border border-white/20 text-white rounded-lg hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleWithdraw}
                    disabled={Boolean(
                      isProcessingWithdraw ||
                      !withdrawAmount ||
                      !!withdrawError ||
                      isLoadingWithdrawalHistory ||
                      (withdrawalData && !withdrawalData.canWithdraw)
                    )}
                    className="flex-1 py-2.5 px-4 bg-white text-[#240B53] rounded-lg hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                  >
                    {isProcessingWithdraw ? 'Processing...' : 'Withdraw'}
                  </button>
                </div>

                {isProcessingWithdraw && (
                  <p className="text-blue-300 text-sm text-center">
                    💾 Processing withdrawal request...
                  </p>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
