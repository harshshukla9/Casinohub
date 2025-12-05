import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useWatchContractEvent } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import { MonadVault } from '../lib/contract'
import { useCallback, useEffect, useState } from 'react'

// Types for better type safety
export interface DepositEvent {
  player: string
  amount: bigint
  timestamp: bigint
  transactionHash: string
  blockNumber: bigint
}

export interface UseDepositOptions {
  onSuccess?: (txHash: string) => void
  onError?: (error: Error) => void
}

export interface UseDepositEventsOptions {
  onDeposit?: (event: DepositEvent) => void
  enabled?: boolean
}

/**
 * Hook to make deposits to the CasinoVault
 * @param options - Configuration options for the deposit
 * @returns Object with deposit function and transaction state
 */
export function useDeposit(options?: UseDepositOptions) {
  const { writeContract, data: hash, error, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  const deposit = useCallback(
    async (amount: string) => {
      try {
        const amountInWei = parseEther(amount)
        await writeContract({
          address: MonadVault.contractAddress as `0x${string}`,
          abi: MonadVault.abi,
          functionName: 'deposit',
          value: amountInWei,
        })
      } catch (err) {
        options?.onError?.(err as Error)
      }
    },
    [writeContract, options]
  )

  // Handle success callback
  useEffect(() => {
    if (isConfirmed && hash) {
      options?.onSuccess?.(hash)
    }
  }, [isConfirmed, hash, options])

  return {
    deposit,
    hash,
    error,
    isPending,
    isConfirming,
    isConfirmed,
    isLoading: isPending || isConfirming,
  }
}

/**
 * Hook to get a player's total deposits
 * @param playerAddress - The address of the player (optional, defaults to connected account)
 * @returns Object with player deposits data and loading state
 */
export function usePlayerDeposits(playerAddress?: string) {
  const { address } = useAccount()
  const targetAddress = playerAddress || address

  const { data, error, isLoading, refetch } = useReadContract({
    address: MonadVault.contractAddress as `0x${string}`,
    abi: MonadVault.abi,
    functionName: 'getPlayerDeposits',
    args: targetAddress ? [targetAddress as `0x${string}`] : undefined,
    query: {
      enabled: !!targetAddress,
    },
  })

  return {
    deposits: data ? formatEther(data as bigint) : '0',
    depositsWei: data ?? BigInt(0),
    error,
    isLoading,
    refetch,
  }
}

/**
 * Hook to get the vault's total balance
 * @returns Object with vault balance data and loading state
 */
export function useVaultBalance() {
  const { data, error, isLoading, refetch } = useReadContract({
    address: MonadVault.contractAddress as `0x${string}`,
    abi: MonadVault.abi,
    functionName: 'getBalance',
  })

  return {
    balance: data ? formatEther(data as bigint) : '0',
    balanceWei: data ?? BigInt(0),
    error,
    isLoading,
    refetch,
  }
}

/**
 * Hook to get the contract owner
 * @returns Object with owner address and loading state
 */
export function useVaultOwner() {
  const { data, error, isLoading, refetch } = useReadContract({
    address: MonadVault.contractAddress as `0x${string}`,
    abi: MonadVault.abi,
    functionName: 'owner',
  })

  return {
    owner: data,
    error,
    isLoading,
    refetch,
  }
}

/**
 * Hook to listen for deposit events
 * @param options - Configuration options for event listening
 * @returns Object with deposit events and loading state
 */
export function useDepositEvents(options?: UseDepositEventsOptions) {
  const [events, setEvents] = useState<DepositEvent[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useWatchContractEvent({
    address: MonadVault.contractAddress as `0x${string}`,
    abi: MonadVault.abi,
    eventName: 'Deposited',
    onLogs(logs) {
      const depositEvents: DepositEvent[] = logs.map((log) => ({
        player: (log as any).args.player as string,
        amount: (log as any).args.amount as bigint,
        timestamp: (log as any).args.timestamp as bigint,
        transactionHash: log.transactionHash || '',
        blockNumber: log.blockNumber || BigInt(0),
      }))

      setEvents((prev) => [...depositEvents, ...prev])
      
      // Call the onDeposit callback for each new event
      depositEvents.forEach((event) => {
        options?.onDeposit?.(event)
      })
    },
    enabled: options?.enabled !== false,
  })

  const clearEvents = useCallback(() => {
    setEvents([])
  }, [])

  return {
    events,
    isLoading,
    clearEvents,
  }
}

/**
 * Hook to get deposit events for a specific player
 * @param playerAddress - The address of the player
 * @returns Object with filtered deposit events
 */
export function usePlayerDepositEvents(playerAddress?: string) {
  const { events, isLoading, clearEvents } = useDepositEvents()
  const { address } = useAccount()
  const targetAddress = playerAddress || address

  const playerEvents = events.filter(
    (event) => event.player.toLowerCase() === targetAddress?.toLowerCase()
  )

  return {
    events: playerEvents,
    isLoading,
    clearEvents,
  }
}
