/**
 * Simple Deposit Component - Ready to use in your app
 * This shows the most common use cases for the CasinoVault hooks
 */

import React, { useState } from 'react'
import { useDeposit, usePlayerDeposits, useVaultBalance, useDepositEvents, useTokenBalance, useTokenAllowance, useApproveToken, useApproveTokenMax } from './index'

export function DepositComponent() {
  const [amount, setAmount] = useState('')

  // Get player's current deposits
  const { deposits, isLoading: isLoadingDeposits, refetch: refetchDeposits } = usePlayerDeposits()

  // Get vault balance
  const { balance, isLoading: isLoadingBalance } = useVaultBalance()

  // Get ERC20 token balance
  const { balance: tokenBalance, isLoading: isLoadingTokenBalance } = useTokenBalance()

  // Check token allowance
  const { allowance, allowanceWei, isLoading: isLoadingAllowance, refetch: refetchAllowance } = useTokenAllowance()
  
  // Format allowance for display - show "Unlimited" for max uint256
  const formatAllowance = (allowanceStr: string, allowanceWei: bigint) => {
    // Max uint256 value: 2^256 - 1
    const maxUint256 = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')
    // If allowance is max uint256 (unlimited approval), show "Unlimited"
    if (allowanceWei >= maxUint256) {
      return 'Unlimited'
    }
    // For regular allowances, format nicely
    const num = parseFloat(allowanceStr)
    if (isNaN(num)) return '0'
    if (num >= 1000000) {
      return num.toLocaleString('en-US', { maximumFractionDigits: 2 })
    }
    return num.toLocaleString('en-US', { maximumFractionDigits: 4 })
  }

  // Approve token hooks
  const { approve, isPending: isApproving, isConfirmed: isApproveConfirmed } = useApproveToken({
    onSuccess: () => {
      refetchAllowance()
      console.log('Token approval successful!')
    },
  })

  const { approveMax, isPending: isApprovingMax, isConfirmed: isApproveMaxConfirmed } = useApproveTokenMax({
    onSuccess: () => {
      refetchAllowance()
      console.log('Unlimited token approval successful!')
    },
  })

  // Deposit function
  const { deposit, isLoading: isDepositing, isConfirmed, needsApproval, amountNeedsApproval } = useDeposit({
    onSuccess: (txHash) => {
      console.log('Deposit successful:', txHash)
      setAmount('')
      refetchDeposits() // Refresh player deposits
    },
    onError: (error) => {
      console.error('Deposit failed:', error)
    },
  })

  // Listen for deposit events (for database integration)
  useDepositEvents({
    onDeposit: async (event) => {
      console.log('New deposit event:', event)
      
      // Here you can save to your database
      try {
        await fetch('/api/deposits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            player: event.player,
            amount: event.amount.toString(),
            timestamp: event.timestamp.toString(),
            transactionHash: event.transactionHash,
            blockNumber: event.blockNumber.toString(),
          }),
        })
        console.log('Deposit saved to database')
      } catch (error) {
        console.error('Failed to save deposit to database:', error)
      }
    },
  })

  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid amount')
      return
    }
    
    // Check if approval is needed
    if (amountNeedsApproval && amountNeedsApproval(amount)) {
      alert('Please approve tokens first before depositing')
      return
    }

    try {
      await deposit(amount)
    } catch (error) {
      if (error instanceof Error && error.message.includes('allowance')) {
        alert('Insufficient token allowance. Please approve tokens first.')
      }
    }
  }

  const handleApprove = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a deposit amount first')
      return
    }
    try {
      await approve(amount)
    } catch (error) {
      console.error('Approval error:', error)
    }
  }

  const handleApproveMax = async () => {
    try {
      await approveMax()
    } catch (error) {
      console.error('Approval error:', error)
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Casino Vault</h2>
      
      {/* Vault Balance */}
      <div className="mb-4 p-3 bg-gray-100 rounded">
        <p className="text-sm text-gray-600">Vault Balance</p>
        <p className="text-lg font-semibold">
          {isLoadingBalance ? 'Loading...' : `${balance || '0'} STT`}
        </p>
      </div>

      {/* Player Deposits */}
      <div className="mb-4 p-3 bg-blue-100 rounded">
        <p className="text-sm text-gray-600">Your Deposits</p>
        <p className="text-lg font-semibold">
          {isLoadingDeposits ? 'Loading...' : `${deposits} STT`}
        </p>
      </div>

      {/* Token Balance */}
      <div className="mb-4 p-3 bg-green-100 rounded">
        <p className="text-sm text-gray-600">Your STT Token Balance</p>
        <p className="text-lg font-semibold">
          {isLoadingTokenBalance ? 'Loading...' : `${tokenBalance || '0'} STT`}
        </p>
      </div>

      {/* Deposit Form */}
      <div className="mb-4">
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
          Deposit Amount (STT)
        </label>
        <input
          id="amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.0"
          step="0.001"
          min="0"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Approval Status */}
      {amount && parseFloat(amount) > 0 && (
        <div className="mb-4 p-3 bg-yellow-50 rounded border border-yellow-200">
          {isLoadingAllowance ? (
            <p className="text-sm text-gray-600">Checking approval status...</p>
          ) : amountNeedsApproval && amountNeedsApproval(amount) ? (
            <div className="space-y-2">
              <p className="text-sm text-yellow-800">
                ⚠️ Approval required: You need to approve {amount} STT tokens before depositing
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleApprove}
                  disabled={isApproving || isApprovingMax}
                  className="flex-1 py-2 px-3 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  {isApproving ? 'Approving...' : `Approve ${amount} STT`}
                </button>
                <button
                  onClick={handleApproveMax}
                  disabled={isApproving || isApprovingMax}
                  className="flex-1 py-2 px-3 bg-yellow-700 text-white rounded-md hover:bg-yellow-800 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  {isApprovingMax ? 'Approving...' : 'Approve Unlimited'}
                </button>
              </div>
              {(isApproveConfirmed || isApproveMaxConfirmed) && (
                <p className="text-sm text-green-600">✅ Approval confirmed! You can now deposit.</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-green-600 break-words">
              ✅ You have sufficient approval ({formatAllowance(allowance || '0', allowanceWei || BigInt(0))} STT approved)
            </p>
          )}
        </div>
      )}

      <button
        onClick={handleDeposit}
        disabled={
          isDepositing ||
          !amount ||
          isLoadingAllowance ||
          Boolean(amountNeedsApproval && amount && amountNeedsApproval(amount))
        }
        className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isDepositing ? 'Depositing...' : 'Deposit'}
      </button>

      {isConfirmed && (
        <p className="mt-2 text-green-600 text-sm text-center">
          ✅ Deposit confirmed!
        </p>
      )}
    </div>
  )
}
