import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useWatchContractEvent } from 'wagmi'
import { parseUnits, formatUnits, type Address } from 'viem'
import { MonadVault, STT_TOKEN_ADDRESS, ERC20_ABI } from '../lib/contract'
import { useCallback, useEffect, useState } from 'react'
import { useTokenAllowance, useApproveToken } from './useERC20'

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
 * Hook to make deposits to the CasinoVault (ERC20 tokens)
 * Note: Users must approve tokens before depositing
 * @param options - Configuration options for the deposit
 * @returns Object with deposit function and transaction state
 */
export function useDeposit(options?: UseDepositOptions) {
  const { address } = useAccount()
  const { writeContract, data: hash, error, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  // Get token decimals
  const { data: decimals } = useReadContract({
    address: STT_TOKEN_ADDRESS as Address,
    abi: ERC20_ABI,
    functionName: 'decimals',
  })
  const tokenDecimals = decimals ?? 18

  // Check allowance
  const { allowanceWei, refetch: refetchAllowance } = useTokenAllowance(
    STT_TOKEN_ADDRESS as Address,
    MonadVault.contractAddress as Address,
    address
  )

  const deposit = useCallback(
    async (amount: string) => {
      try {
        const amountInWei = parseUnits(amount, tokenDecimals)
        const vaultAddress = MonadVault.contractAddress as Address

        // Check if approval is needed
        if (allowanceWei < amountInWei) {
          throw new Error('Insufficient token allowance. Please approve tokens first.')
        }

        // Deposit tokens
        await writeContract({
          address: vaultAddress,
          abi: MonadVault.abi,
          functionName: 'deposit',
          args: [amountInWei],
        })
      } catch (err) {
        options?.onError?.(err as Error)
        throw err
      }
    },
    [writeContract, options, allowanceWei, tokenDecimals]
  )

  // Handle success callback
  useEffect(() => {
    if (isConfirmed && hash) {
      options?.onSuccess?.(hash)
      // Refetch allowance after successful deposit
      refetchAllowance()
    }
  }, [isConfirmed, hash, options, refetchAllowance])

  return {
    deposit,
    hash,
    error,
    isPending,
    isConfirming,
    isConfirmed,
    isLoading: isPending || isConfirming,
    needsApproval: allowanceWei === BigInt(0),
    allowanceWei,
    amountNeedsApproval: (amount: string) => {
      const amountInWei = parseUnits(amount, tokenDecimals)
      return allowanceWei < amountInWei
    },
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

  // Get token decimals for proper formatting
  const { data: decimals } = useReadContract({
    address: STT_TOKEN_ADDRESS as Address,
    abi: ERC20_ABI,
    functionName: 'decimals',
  })
  const tokenDecimals = decimals ?? 18

  return {
    deposits: data ? formatUnits(data as bigint, tokenDecimals) : '0',
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

  // Get token decimals for proper formatting
  const { data: decimals } = useReadContract({
    address: STT_TOKEN_ADDRESS as Address,
    abi: ERC20_ABI,
    functionName: 'decimals',
  })
  const tokenDecimals = decimals ?? 18

  return {
    balance: data ? formatUnits(data as bigint, tokenDecimals) : '0',
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
