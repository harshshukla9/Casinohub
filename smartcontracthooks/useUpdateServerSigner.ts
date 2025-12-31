import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { StatusL2Withdrawl } from '@/lib/contract';

// Chain ID for Monad Testnet
const MONAD_TESTNET_CHAIN_ID = 10143;

/**
 * Hook to update the server signer address in the contract
 * Only callable by contract owner
 */
export function useUpdateServerSigner() {
  const { writeContractAsync, data: hash, isPending, error } = useWriteContract();

  const updateServerSigner = async (newSignerAddress: string) => {
    try {
      console.log('🔄 Updating server signer to:', newSignerAddress);

      const txHash = await writeContractAsync({
        address: StatusL2Withdrawl.contractAddress as `0x${string}`,
        abi: StatusL2Withdrawl.abi,
        functionName: 'updateServerSigner',
        args: [newSignerAddress as `0x${string}`],
        chainId: MONAD_TESTNET_CHAIN_ID,
      });

      console.log('✅ Server signer update transaction submitted:', txHash);
      return txHash;
    } catch (err) {
      console.error('❌ Failed to update server signer:', err);
      throw err;
    }
  };

  return {
    updateServerSigner,
    hash,
    isPending,
    error,
  };
}

/**
 * Hook to unpause the contract
 * Only callable by contract owner
 */
export function useSetPaused() {
  const { writeContractAsync, data: hash, isPending, error } = useWriteContract();

  const setPaused = async (paused: boolean) => {
    try {
      console.log(`${paused ? '⏸️ Pausing' : '▶️ Unpausing'} contract...`);

      const txHash = await writeContractAsync({
        address: StatusL2Withdrawl.contractAddress as `0x${string}`,
        abi: StatusL2Withdrawl.abi,
        functionName: 'setPaused',
        args: [paused],
        chainId: MONAD_TESTNET_CHAIN_ID,
      });

      console.log('✅ Contract pause state updated:', txHash);
      return txHash;
    } catch (err) {
      console.error('❌ Failed to update pause state:', err);
      throw err;
    }
  };

  return {
    setPaused,
    hash,
    isPending,
    error,
  };
}

/**
 * Hook to wait for update transaction confirmation
 */
export function useWaitForUpdate(hash?: `0x${string}`) {
  const { data: receipt, isLoading, isSuccess, isError, error } = useWaitForTransactionReceipt({
    hash,
    chainId: MONAD_TESTNET_CHAIN_ID,
    query: {
      enabled: !!hash,
    }
  });

  return {
    receipt,
    isLoading,
    isSuccess,
    isError,
    error,
  };
}

