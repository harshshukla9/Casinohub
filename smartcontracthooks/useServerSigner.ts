import { useReadContract } from 'wagmi';
import { StatusL2Withdrawl } from '@/lib/contract';

// Chain ID for Monad Testnet
const MONAD_TESTNET_CHAIN_ID = 10143;

/**
 * Hook to get the server signer address from the contract
 * This is useful for debugging - the server signer should match
 * the public address derived from SERVER_PRIVATE_KEY
 */
export function useServerSigner() {
  const { data: serverSigner, isLoading, refetch } = useReadContract({
    address: StatusL2Withdrawl.contractAddress as `0x${string}`,
    abi: StatusL2Withdrawl.abi,
    functionName: 'serverSigner',
    chainId: MONAD_TESTNET_CHAIN_ID,
  });

  return {
    serverSigner: serverSigner as string | undefined,
    isLoading,
    refetch,
  };
}

/**
 * Hook to check if the contract is paused
 */
export function useContractPaused() {
  const { data: isPaused, isLoading, refetch } = useReadContract({
    address: StatusL2Withdrawl.contractAddress as `0x${string}`,
    abi: StatusL2Withdrawl.abi,
    functionName: 'paused',
    chainId: MONAD_TESTNET_CHAIN_ID,
  });

  return {
    isPaused: isPaused as boolean | undefined,
    isLoading,
    refetch,
  };
}

