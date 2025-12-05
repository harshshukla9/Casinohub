import React, { useState, useEffect, useCallback } from 'react'
import { useAccount } from 'wagmi'
import { RefreshCcw } from 'lucide-react';

interface UserBalanceData {
  balance: number
  totalDeposited: number
  totalWithdrawn: number
}

export function UserBalanceDisplay() {
  const { address } = useAccount()
  const [userBalance, setUserBalance] = useState<UserBalanceData | null>(null)
  const [isLoading, setIsLoading] = useState(false)

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

  useEffect(() => {
    if (!address) return

    const handleDepositCompleted = () => {
      fetchUserBalance()
    }

    const handleBalanceUpdated = () => {
      fetchUserBalance()
    }

    window.addEventListener('depositCompleted', handleDepositCompleted)
    window.addEventListener('balanceUpdated', handleBalanceUpdated)
    window.addEventListener('betPlaced', handleBalanceUpdated)
    return () => {
      window.removeEventListener('depositCompleted', handleDepositCompleted)
      window.removeEventListener('balanceUpdated', handleBalanceUpdated)
      window.removeEventListener('betPlaced', handleBalanceUpdated)
    }
  }, [address, fetchUserBalance])

  if (!address) {
    return null
  }

  return (
    <div className="flex items-center gap-3">
      <div className="bg-purple-600/20 border whitespace-nowrap border-purple-500/30 rounded-lg px-2 py-2 flex items-start">
          <div className="text-sm">
            <div className="text-gray-300">Balance</div>
            <div className="text-white font-semibold">
              {isLoading ? (
                <span className="text-gray-400">Loading...</span>
              ) : (
                <span className="text-purple-300">
                  {isLoading ? 'Loading...' : `${Number(userBalance?.balance || 0).toFixed(2)} STT`}
                </span>
              )}
            </div>
          </div>
          <button
        onClick={fetchUserBalance}
        disabled={isLoading}
        className="p-1.5 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-gray-800/50 disabled:opacity-50"
        title="Refresh balance"
      >
        <RefreshCcw className={`${isLoading ? 'animate-spin' : ''} text-white`} size={12} />
        
      </button>
      </div>
    </div>
  )
}
