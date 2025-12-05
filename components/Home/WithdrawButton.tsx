import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useAccount } from 'wagmi'

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

export function WithdrawButton() {
  const [amount, setAmount] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [error, setError] = useState('')
  const [userBalance, setUserBalance] = useState<number>(0)
  const [withdrawalData, setWithdrawalData] = useState<WithdrawalData | null>(null)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const { address } = useAccount()

  const MIN_WITHDRAWAL_AMOUNT = 0.1

  // Ensure we're in the browser before rendering portal
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Fetch user balance
  const fetchUserBalance = async () => {
    if (!address) return

    try {
      const response = await fetch(`/api/user-balance?walletAddress=${address}`)
      if (response.ok) {
        const data = await response.json()
        setUserBalance(data.user?.balance || 0)
      }
    } catch (error) {
      console.error('Failed to fetch user balance:', error)
    }
  }

  // Fetch withdrawal history
  const fetchWithdrawalHistory = async () => {
    if (!address) return

    setIsLoadingHistory(true)
    try {
      const response = await fetch(`/api/withdraw?walletAddress=${address}`)
      if (response.ok) {
        const data = await response.json()
        setWithdrawalData(data)
      }
    } catch (error) {
      console.error('Failed to fetch withdrawal history:', error)
    } finally {
      setIsLoadingHistory(false)
    }
  }

  const openModal = () => {
    if (!address) {
      alert('Please connect your wallet first')
      return
    }
    setError('')
    setAmount('')
    fetchUserBalance()
    fetchWithdrawalHistory()
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setAmount('')
    setError('')
    setIsProcessing(false)
  }

  // Validate amount when it changes
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAmount = e.target.value
    setAmount(newAmount)

    // Validate amount
    if (newAmount) {
      const amountNum = parseFloat(newAmount)
      if (isNaN(amountNum) || amountNum <= 0) {
        setError('Amount must be greater than 0')
      } else if (amountNum < MIN_WITHDRAWAL_AMOUNT) {
        setError(`Minimum withdrawal is ${MIN_WITHDRAWAL_AMOUNT} STT`)
      } else if (amountNum > userBalance) {
        setError('Insufficient balance')
      } else {
        setError('')
      }
    } else {
      setError('')
    }
  }

  const handleWithdraw = async () => {
    if (!address || !amount) {
      setError('Please enter a valid amount')
      return
    }

    const withdrawAmount = parseFloat(amount)
    
    // Final validation
    if (withdrawAmount < MIN_WITHDRAWAL_AMOUNT) {
      setError(`Minimum withdrawal is ${MIN_WITHDRAWAL_AMOUNT} STT`)
      return
    }

    if (withdrawAmount > userBalance) {
      setError('Insufficient balance')
      return
    }

    if (!withdrawalData?.canWithdraw) {
      setError(`You can only withdraw once per 24 hours. Please wait ${withdrawalData?.hoursRemaining} more hour(s).`)
      return
    }

    setIsProcessing(true)
    setError('')

    try {
      const response = await fetch('/api/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: address,
          amount: withdrawAmount,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to process withdrawal')
      }

      // Success! Dispatch event to refresh balance
      window.dispatchEvent(new CustomEvent('balanceUpdated'))
      
      alert(`✅ Withdrawal request submitted!\n💰 Amount: ${withdrawAmount} STT\n📊 New Balance: ${result.newBalance} STT\n⏱️ Estimated processing: ${result.estimatedProcessingTime}\n\nYour balance has been deducted immediately.`)
      
      closeModal()
      
    } catch (error) {
      console.error('Withdrawal failed:', error)
      setError(error instanceof Error ? error.message : 'Failed to process withdrawal')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <>
      {/* Withdraw Button */}
      <button
        onClick={openModal}
        className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-md hover:from-green-500 hover:to-emerald-500 transition-colors"
      >
        Withdraw STT
      </button>

      {/* Withdraw Modal */}
      {isModalOpen && isMounted && createPortal(
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] animate-in fade-in duration-200"
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
          onClick={closeModal}
        >
          <div 
            className="rounded-lg p-6 w-full max-w-md mx-4 shadow-2xl animate-in zoom-in-95 duration-200 relative bg-gray-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Withdraw STT</h2>
              <button
                onClick={closeModal}
                className="text-white hover:text-gray-300 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
              >
                ×
              </button>
            </div>


            {/* Current Balance */}
            <div className="mb-4 p-3 bg-white/10 rounded">
              <p className="text-sm text-white/80">Available Balance</p>
              <p className="text-lg font-semibold text-green-400">{userBalance.toFixed(4)} STT</p>
            </div>

            {/* 24-Hour Cooldown Warning */}
            {!isLoadingHistory && withdrawalData && !withdrawalData.canWithdraw && (
              <div className="mb-4 p-3 bg-yellow-900/30 border border-yellow-700/50 rounded">
                <p className="text-sm text-yellow-400">
                  ⏱️ You can only withdraw once per 24 hours. Please wait {withdrawalData.hoursRemaining} more hour(s).
                </p>
              </div>
            )}

            {/* Amount Input */}
            <div className="mb-4">
              <div className="flex flex-row space-x-2 mb-2">
                <label htmlFor="amount" className="block text-sm font-medium text-white">
                  Amount
                </label>
                <p className="text-sm text-white/60">
                  (Min: {MIN_WITHDRAWAL_AMOUNT} STT)
                </p>
              </div>
              <input
                id="amount"
                type="number"
                value={amount}
                onChange={handleAmountChange}
                placeholder="0.0"
                step="0.001"
                min={MIN_WITHDRAWAL_AMOUNT}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 text-white bg-white/20 placeholder-white/60 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                  error ? 'border-red-500 focus:ring-red-500' : 'border-white/30 focus:ring-green-500'
                }`}
                style={{
                  MozAppearance: 'textfield'
                }}
                disabled={Boolean(isProcessing || isLoadingHistory || (withdrawalData && !withdrawalData.canWithdraw))}
              />
              {/* Error Message */}
              {error && (
                <p className="mt-2 text-sm text-red-400">{error}</p>
              )}
            </div>

            {/* Important Notice */}
            <div className="mb-4 p-3 bg-blue-900/30 border border-blue-700/50 rounded">
              <p className="text-xs text-blue-300">
                ⚠️ Your balance will be deducted immediately upon request. Withdrawals are processed within 24-48 hours.
              </p>
            </div>

            {/* Withdrawal History */}
            {withdrawalData && withdrawalData.withdrawals.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium text-white mb-2">Recent Withdrawals</p>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {withdrawalData.withdrawals.slice(0, 3).map((w) => (
                    <div key={w._id} className="p-2 bg-white/5 rounded text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-white">{w.amount.toFixed(4)} STT</span>
                        <span className={`px-2 py-0.5 rounded ${
                          w.status === 'completed' ? 'bg-green-900/50 text-green-300' :
                          w.status === 'pending' ? 'bg-yellow-900/50 text-yellow-300' :
                          'bg-red-900/50 text-red-300'
                        }`}>
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

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={closeModal}
                className="flex-1 py-2 px-4 border border-white/30 text-white rounded-md hover:bg-white/20"
              >
                Cancel
              </button>
              <button
                onClick={handleWithdraw}
                disabled={Boolean(isProcessing || !amount || !!error || isLoadingHistory || (withdrawalData && !withdrawalData.canWithdraw))}
                className="flex-1 py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Processing...' : 'Withdraw'}
              </button>
            </div>

            {/* Processing Status */}
            {isProcessing && (
              <p className="mt-3 text-blue-400 text-sm text-center">
                💾 Processing withdrawal request...
              </p>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

