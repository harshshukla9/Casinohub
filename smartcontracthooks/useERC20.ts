import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits, formatUnits, type Address } from 'viem'
import { STT_TOKEN_ADDRESS, ERC20_ABI, MonadVault } from '../lib/contract'
import { useCallback, useEffect, useState } from 'react'

export interface UseERC20Options {
  onSuccess?: (txHash: string) => void
  onError?: (error: Error) => void
}

/**
 * Hook to get ERC20 token balance for a user
 * @param tokenAddress - The ERC20 token address (defaults to STT token)
 * @param userAddress - The user address (optional, defaults to connected account)
 * @returns Object with token balance data and loading state
 */
export function useTokenBalance(tokenAddress?: Address, userAddress?: string) {
  const { address } = useAccount()
  const targetAddress = (userAddress || address) as Address | undefined
  const token = (tokenAddress || STT_TOKEN_ADDRESS) as Address

  const { data, error, isLoading, refetch } = useReadContract({
    address: token,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: targetAddress ? [targetAddress] : undefined,
    query: {
      enabled: !!targetAddress,
    },
  })

  // Get decimals for proper formatting
  const { data: decimals } = useReadContract({
    address: token,
    abi: ERC20_ABI,
    functionName: 'decimals',
    query: {
      enabled: !!token,
    },
  })

  const decimalsValue = decimals ?? 18 // Default to 18 if not available

  return {
    balance: data ? formatUnits(data as bigint, decimalsValue) : '0',
    balanceWei: data ?? BigInt(0),
    decimals: decimalsValue,
    error,
    isLoading,
    refetch,
  }
}

/**
 * Hook to check token allowance for a spender
 * @param tokenAddress - The ERC20 token address (defaults to STT token)
 * @param spenderAddress - The spender address (defaults to CasinoVault contract)
 * @param ownerAddress - The owner address (optional, defaults to connected account)
 * @returns Object with allowance data and loading state
 */
export function useTokenAllowance(
  tokenAddress?: Address,
  spenderAddress?: Address,
  ownerAddress?: string
) {
  const { address } = useAccount()
  const owner = (ownerAddress || address) as Address | undefined
  const token = (tokenAddress || STT_TOKEN_ADDRESS) as Address
  const spender = (spenderAddress || (MonadVault.contractAddress as Address))

  const { data, error, isLoading, refetch } = useReadContract({
    address: token,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: owner && spender ? [owner, spender] : undefined,
    query: {
      enabled: !!owner && !!spender,
    },
  })

  // Get decimals for proper formatting
  const { data: decimals } = useReadContract({
    address: token,
    abi: ERC20_ABI,
    functionName: 'decimals',
    query: {
      enabled: !!token,
    },
  })

  const decimalsValue = decimals ?? 18

  return {
    allowance: data ? formatUnits(data as bigint, decimalsValue) : '0',
    allowanceWei: data ?? BigInt(0),
    decimals: decimalsValue,
    error,
    isLoading,
    refetch,
  }
}

/**
 * Hook to approve ERC20 tokens for a spender
 * @param options - Configuration options
 * @returns Object with approve function and transaction state
 */
export function useApproveToken(options?: UseERC20Options) {
  const { writeContract, data: hash, error, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  // Get decimals for the token
  const { data: decimals } = useReadContract({
    address: STT_TOKEN_ADDRESS as Address,
    abi: ERC20_ABI,
    functionName: 'decimals',
  })
  const tokenDecimals = decimals ?? 18

  const approve = useCallback(
    async (amount: string, spenderAddress?: Address, tokenAddress?: Address) => {
      try {
        const token = (tokenAddress || STT_TOKEN_ADDRESS) as Address
        const spender = (spenderAddress || (MonadVault.contractAddress as Address))

        // Get decimals for the specific token if different
        let decimalsToUse = tokenDecimals
        if (tokenAddress && tokenAddress !== STT_TOKEN_ADDRESS) {
          // For now, default to 18. In a full implementation, you'd read decimals here
          decimalsToUse = 18
        }

        const amountInWei = parseUnits(amount, decimalsToUse)
        
        await writeContract({
          address: token,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [spender, amountInWei],
        })
      } catch (err) {
        options?.onError?.(err as Error)
        throw err
      }
    },
    [writeContract, options, tokenDecimals]
  )

  // Handle success callback
  useEffect(() => {
    if (isConfirmed && hash) {
      options?.onSuccess?.(hash)
    }
  }, [isConfirmed, hash, options])

  return {
    approve,
    hash,
    error,
    isPending,
    isConfirming,
    isConfirmed,
    isLoading: isPending || isConfirming,
  }
}

/**
 * Hook to approve unlimited tokens (uses max uint256)
 * @param options - Configuration options
 * @returns Object with approveMax function and transaction state
 */
export function useApproveTokenMax(options?: UseERC20Options) {
  const { writeContract, data: hash, error, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  const approveMax = useCallback(
    async (spenderAddress?: Address, tokenAddress?: Address) => {
      try {
        const token = (tokenAddress || STT_TOKEN_ADDRESS) as Address
        const spender = (spenderAddress || (MonadVault.contractAddress as Address))
        
        // Max uint256 value for unlimited approval
        const maxAmount = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')
        
        await writeContract({
          address: token,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [spender, maxAmount],
        })
      } catch (err) {
        options?.onError?.(err as Error)
        throw err
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
    approveMax,
    hash,
    error,
    isPending,
    isConfirming,
    isConfirmed,
    isLoading: isPending || isConfirming,
  }
}

