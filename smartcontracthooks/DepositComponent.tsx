/**
 * Simple Deposit Component - Ready to use in your app
 * This shows the most common use cases for the CasinoVault hooks
 */

import React, { useState } from 'react'
import { useDeposit, usePlayerDeposits, useVaultBalance, useDepositEvents } from './index'

export function DepositComponent() {
  const [amount, setAmount] = useState('')

  // Get player's current deposits
  const { deposits, isLoading: isLoadingDeposits, refetch: refetchDeposits } = usePlayerDeposits()

  // Get vault balance
  const { balance, isLoading: isLoadingBalance } = useVaultBalance()

  // Deposit function
  const { deposit, isLoading: isDepositing, isConfirmed } = useDeposit({
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
    await deposit(amount)
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

      <button
        onClick={handleDeposit}
        disabled={isDepositing || !amount}
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
