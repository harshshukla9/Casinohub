'use client'

import { useCallback, useState } from 'react'
import { useAccount, useWalletClient, usePublicClient, useReadContract } from 'wagmi'
import { StatusL2Withdrawl, STT_TOKEN_ADDRESS } from '@/lib/contract'
import { parseUnits } from 'viem'

// Chain ID for Status Network Sepolia (from @reown/appkit/networks)
const STATUS_NETWORK_SEPOLIA_CHAIN_ID = 1660990954

/**
 * Hook to get user's current nonce
 */
export function useUserNonce() {
  const { address } = useAccount()

  const { data: nonce, isLoading, refetch } = useReadContract({
    address: StatusL2Withdrawl.contractAddress as `0x${string}`,
    abi: StatusL2Withdrawl.abi,
    functionName: 'getUserNonce',
    args: address ? [address] : undefined,
    chainId: STATUS_NETWORK_SEPOLIA_CHAIN_ID,
    query: {
      enabled: !!address,
    }
  })

  return {
    nonce: nonce as bigint | undefined,
    isLoading,
    refetch,
  }
}

/**
 * Hook to check if a signature has been used
 */
export function useIsSignatureUsed(signature?: `0x${string}`) {
  const { data: isUsed, isLoading } = useReadContract({
    address: StatusL2Withdrawl.contractAddress as `0x${string}`,
    abi: StatusL2Withdrawl.abi,
    functionName: 'isSignatureUsed',
    args: signature ? [signature] : undefined,
    chainId: STATUS_NETWORK_SEPOLIA_CHAIN_ID,
    query: {
      enabled: !!signature,
    }
  })

  return {
    isUsed: isUsed as boolean | undefined,
    isLoading,
  }
}

/**
 * Hook to get contract's token balance
 */
export function useWithdrawalContractBalance() {
  const { data: balance, isLoading, refetch } = useReadContract({
    address: StatusL2Withdrawl.contractAddress as `0x${string}`,
    abi: StatusL2Withdrawl.abi,
    functionName: 'getTokenBalance',
    args: [STT_TOKEN_ADDRESS],
    chainId: STATUS_NETWORK_SEPOLIA_CHAIN_ID,
  })

  return {
    balance: balance as bigint | undefined,
    isLoading,
    refetch,
  }
}

/**
 * Main hook to claim withdrawal - EXACTLY like useClaimReward from farape-project
 */
export function useClaimWithdrawal() {
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()
  const { address } = useAccount()
  const [isPending, setIsPending] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hash, setHash] = useState<`0x${string}` | undefined>(undefined)

  const contractAddress = StatusL2Withdrawl.contractAddress as `0x${string}`
  const abi = StatusL2Withdrawl.abi

  const claimWithdrawal = useCallback(async (
    amount: string,
    nonce: bigint,
    signature: `0x${string}`
  ) => {
    console.log('claimWithdrawal called', { 
      hasWalletClient: !!walletClient, 
      address, 
      contractAddress,
      amount,
      nonce: nonce.toString(),
      signature
    })
    
    if (!walletClient || !address) {
      const errorMsg = 'Wallet not connected'
      console.error('Wallet check failed:', { walletClient: !!walletClient, address })
      setError(errorMsg)
      throw new Error(errorMsg)
    }

    if (!publicClient) {
      const errorMsg = 'Public client not available'
      console.error('Public client not available')
      setError(errorMsg)
      throw new Error(errorMsg)
    }
    
    setIsPending(true)
    setIsSuccess(false)
    setError(null)
    setHash(undefined)
    
    try {
      // Convert amount to wei (18 decimals for STT token)
      const amountInWei = parseUnits(amount, 18)

      console.log('Calling claimWithdrawal...', { 
        address, 
        contractAddress,
        args: [STT_TOKEN_ADDRESS, amountInWei.toString(), nonce.toString(), signature]
      })
      
      const txHash = await walletClient.writeContract({
        address: contractAddress,
        abi,
        functionName: 'claimWithdrawal',
        args: [
          STT_TOKEN_ADDRESS as `0x${string}`,
          amountInWei,
          nonce,
          signature,
        ],
      })

      console.log('Transaction submitted successfully:', txHash)
      setHash(txHash)
      
      // Wait for transaction confirmation
      const receipt = await publicClient.waitForTransactionReceipt({ 
        hash: txHash,
        timeout: 60_000 // 60 seconds timeout
      })
      
      console.log('Transaction confirmed:', receipt)
      
      if (receipt.status === 'success') {
        setIsSuccess(true)
        return { success: true, hash: txHash, receipt }
      } else {
        const errorMsg = 'Transaction failed'
        setError(errorMsg)
        throw new Error(errorMsg)
      }
    } catch (err: any) {
      console.error('Claim withdrawal transaction failed:', err)
      const errorMsg = err?.message || 'Failed to claim withdrawal'
      setError(errorMsg)
      throw new Error(errorMsg)
    } finally {
      setIsPending(false)
    }
  }, [walletClient, address, contractAddress, abi, publicClient])

  const reset = useCallback(() => {
    setIsPending(false)
    setIsSuccess(false)
    setError(null)
    setHash(undefined)
  }, [])

  return { 
    claimWithdrawal, 
    isPending, 
    isSuccess, 
    error, 
    hash,
    reset 
  }
}

/**
 * Hook to verify signature on-chain (for testing/debugging)
 */
export function useVerifySignature(
  amount?: string,
  nonce?: bigint,
  signature?: `0x${string}`
) {
  const { data: isValid, isLoading } = useReadContract({
    address: StatusL2Withdrawl.contractAddress as `0x${string}`,
    abi: StatusL2Withdrawl.abi,
    functionName: 'verifySignature',
    args: amount && nonce !== undefined && signature
      ? [STT_TOKEN_ADDRESS as `0x${string}`, parseUnits(amount, 18), nonce, signature]
      : undefined,
    chainId: STATUS_NETWORK_SEPOLIA_CHAIN_ID,
    query: {
      enabled: !!amount && nonce !== undefined && !!signature,
    }
  })

  return {
    isValid: isValid as boolean | undefined,
    isLoading,
  }
}
