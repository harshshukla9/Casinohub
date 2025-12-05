import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther } from 'viem'
import { MonadVault } from '../lib/contract'
import { useCallback, useEffect } from 'react'

export interface UseVaultOwnerOptions {
  onSuccess?: (txHash: string) => void
  onError?: (error: Error) => void
}

/**
 * Hook for owner to fund the vault
 * @param options - Configuration options
 * @returns Object with fundVault function and transaction state
 */
export function useFundVault(options?: UseVaultOwnerOptions) {
  const { writeContract, data: hash, error, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  const fundVault = useCallback(
    async (amount: string) => {
      try {
        const amountInWei = parseEther(amount)
        await writeContract({
          address: MonadVault.contractAddress as `0x${string}`,
          abi: MonadVault.abi,
          functionName: 'fundVault',
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
    fundVault,
    hash,
    error,
    isPending,
    isConfirming,
    isConfirmed,
    isLoading: isPending || isConfirming,
  }
}

/**
 * Hook for owner to perform emergency withdrawal
 * @param options - Configuration options
 * @returns Object with emergencyWithdraw function and transaction state
 */
export function useEmergencyWithdraw(options?: UseVaultOwnerOptions) {
  const { writeContract, data: hash, error, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  const emergencyWithdraw = useCallback(async () => {
    try {
      await writeContract({
        address: MonadVault.contractAddress as `0x${string}`,
        abi: MonadVault.abi,
        functionName: 'emergencyWithdraw',
      })
    } catch (err) {
      options?.onError?.(err as Error)
    }
  }, [writeContract, options])

  // Handle success callback
  useEffect(() => {
    if (isConfirmed && hash) {
      options?.onSuccess?.(hash)
    }
  }, [isConfirmed, hash, options])

  return {
    emergencyWithdraw,
    hash,
    error,
    isPending,
    isConfirming,
    isConfirmed,
    isLoading: isPending || isConfirming,
  }
}

/**
 * Hook for owner to transfer ownership
 * @param options - Configuration options
 * @returns Object with transferOwnership function and transaction state
 */
export function useTransferOwnership(options?: UseVaultOwnerOptions) {
  const { writeContract, data: hash, error, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  const transferOwnership = useCallback(
    async (newOwner: string) => {
      try {
        await writeContract({
          address: MonadVault.contractAddress as `0x${string}`,
          abi: MonadVault.abi,
          functionName: 'transferOwnership',
          args: [newOwner as `0x${string}`],
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
    transferOwnership,
    hash,
    error,
    isPending,
    isConfirming,
    isConfirmed,
    isLoading: isPending || isConfirming,
  }
}
