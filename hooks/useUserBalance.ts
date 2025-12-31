'use client'
import { useAccount } from 'wagmi'
import { useState, useEffect, useCallback } from 'react'

interface UserBalanceData {
  balance: number
  totalDeposited: number
  totalWithdrawn: number
  totalBets?: number
  totalWinnings?: number
}

export function useUserBalance() {
  const { address } = useAccount()
  const [userBalance, setUserBalance] = useState<UserBalanceData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchUserBalance = useCallback(async () => {
    if (!address) {
      setUserBalance(null)
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/user-balance?walletAddress=${address}`)
      if (response.ok) {
        const data = await response.json()
        console.log('useUserBalance - Fetched balance:', data.user?.balance)
        setUserBalance(data.user)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to fetch balance')
      }
    } catch (err) {
      console.error('Failed to fetch user balance:', err)
      setError('Failed to fetch balance')
    } finally {
      setIsLoading(false)
    }
  }, [address])

  useEffect(() => {
    fetchUserBalance()
  }, [fetchUserBalance])

  // Listen for balance update events
  useEffect(() => {
    if (!address) return

    const handleBalanceUpdate = () => {
      fetchUserBalance()
    }

    window.addEventListener('balanceUpdated', handleBalanceUpdate)
    window.addEventListener('depositCompleted', handleBalanceUpdate)
    window.addEventListener('betPlaced', handleBalanceUpdate)
    window.addEventListener('cashoutCompleted', handleBalanceUpdate)
    window.addEventListener('withdrawCompleted', handleBalanceUpdate)

    return () => {
      window.removeEventListener('balanceUpdated', handleBalanceUpdate)
      window.removeEventListener('depositCompleted', handleBalanceUpdate)
      window.removeEventListener('betPlaced', handleBalanceUpdate)
      window.removeEventListener('cashoutCompleted', handleBalanceUpdate)
      window.removeEventListener('withdrawCompleted', handleBalanceUpdate)
    }
  }, [address, fetchUserBalance])

  return {
    balance: userBalance?.balance || 0,
    totalDeposited: userBalance?.totalDeposited || 0,
    totalWithdrawn: userBalance?.totalWithdrawn || 0,
    totalBets: userBalance?.totalBets || 0,
    totalWinnings: userBalance?.totalWinnings || 0,
    isLoading,
    error,
    refetch: fetchUserBalance,
  }
}

