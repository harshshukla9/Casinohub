import React, { useState, useEffect, useCallback } from 'react'
import { useAccount } from 'wagmi'
import { usePlayerDeposits } from '../../smartcontracthooks'

interface UserBalanceData {
  balance: number
  totalDeposited: number
  totalWithdrawn: number
}

export function UserBalance() {
  const { address } = useAccount()
  const [userBalance, setUserBalance] = useState<UserBalanceData | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Get deposits from smart contract
  const { deposits: contractDeposits, isLoading: isLoadingContract, refetch: refetchContract } = usePlayerDeposits()

  // Fetch user balance from database
  const fetchUserBalance = useCallback(async () => {
    if (!address) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/user-balance?walletAddress=${address}`)
      if (response.ok) {
        const data = await response.json()
        setUserBalance(data.user)
      }
    } catch (error) {
      console.error('Failed to fetch user balance:', error)
    } finally {
      setIsLoading(false)
    }
  }, [address])

  useEffect(() => {
    fetchUserBalance()
  }, [fetchUserBalance])

  // Listen for storage events to refresh when deposit is completed
  useEffect(() => {
    if (!address) return

    const handleStorageChange = () => {
      fetchUserBalance()
      refetchContract()
    }

    window.addEventListener('storage', handleStorageChange)
    
    // Also listen for custom events
    window.addEventListener('depositCompleted', handleStorageChange)
    window.addEventListener('balanceUpdated', handleStorageChange)
    window.addEventListener('betPlaced', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('depositCompleted', handleStorageChange)
      window.removeEventListener('balanceUpdated', handleStorageChange)
      window.removeEventListener('betPlaced', handleStorageChange)
    }
  }, [address, fetchUserBalance, refetchContract])

  if (!address) {
    return null
  }

  return (
    <div className="space-y-4 border border-[#333] rounded-md p-4">
      <h2 className="text-xl font-bold text-left">Your Balance</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Smart Contract Deposits */}
        <div className="bg-blue-100 p-3 rounded">
          <p className="text-sm text-gray-600">Smart Contract</p>
          <p className="text-lg font-semibold">
            {isLoadingContract ? 'Loading...' : `${contractDeposits} MCS`}
          </p>
        </div>

        {/* Database Balance */}
        <div className="bg-green-100 p-3 rounded">
          <p className="text-sm text-gray-600">Balance</p>
          <p className="text-lg font-semibold">
            {isLoading ? 'Loading...' : `${userBalance?.balance || 0}.toFixed(2) MCS`}
          </p>
        </div>

        {/* Total Deposited */}
        <div className="bg-purple-100 p-3 rounded">
          <p className="text-sm text-gray-600">Total Deposited</p>
          <p className="text-lg font-semibold">
            {isLoading ? 'Loading...' : `${userBalance?.totalDeposited || 0} MCS`}
          </p>
        </div>
      </div>

      {/* Refresh Button */}
      <button
        onClick={fetchUserBalance}
        disabled={isLoading}
        className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 disabled:opacity-50"
      >
        {isLoading ? 'Refreshing...' : 'Refresh Balance'}
      </button>
    </div>
  )
}
