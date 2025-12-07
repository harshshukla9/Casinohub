import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { parseUnits, type Address } from 'viem'
import { MonadVault, STT_TOKEN_ADDRESS, ERC20_ABI } from '../lib/contract'
import { useCallback, useEffect } from 'react'
import { useTokenAllowance, useApproveToken } from './useERC20'

export interface UseVaultOwnerOptions {
  onSuccess?: (txHash: string) => void
  onError?: (error: Error) => void
}

/**
 * Hook for owner to fund the vault (ERC20 tokens)
 * Note: Owner must approve tokens before funding
 * @param options - Configuration options
 * @returns Object with fundVault function and transaction state
 */
export function useFundVault(options?: UseVaultOwnerOptions) {
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

  const fundVault = useCallback(
    async (amount: string) => {
      try {
        const amountInWei = parseUnits(amount, tokenDecimals)
        const vaultAddress = MonadVault.contractAddress as Address

        // Check if approval is needed
        if (allowanceWei < amountInWei) {
          throw new Error('Insufficient token allowance. Please approve tokens first.')
        }

        await writeContract({
          address: vaultAddress,
          abi: MonadVault.abi,
          functionName: 'fundVault',
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
      refetchAllowance()
    }
  }, [isConfirmed, hash, options, refetchAllowance])

  return {
    fundVault,
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
