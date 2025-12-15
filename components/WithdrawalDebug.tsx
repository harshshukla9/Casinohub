'use client';

import { useServerSigner, useContractPaused, useWithdrawalContractBalance, useUserNonce } from '@/smartcontracthooks';
import { useAccount, useChainId } from 'wagmi';
import { formatUnits } from 'viem';
import { StatusL2Withdrawl, STT_TOKEN_ADDRESS } from '@/lib/contract';

// Chain ID for Status Network Sepolia (from @reown/appkit/networks)
const STATUS_NETWORK_SEPOLIA_CHAIN_ID = 1660990954;

/**
 * Debug component to show withdrawal contract status
 * Only visible in development mode
 */
export function WithdrawalDebug() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { serverSigner, isLoading: isLoadingSigner } = useServerSigner();
  const { isPaused, isLoading: isLoadingPaused } = useContractPaused();
  const { balance: contractBalance, isLoading: isLoadingBalance } = useWithdrawalContractBalance();
  const { nonce, isLoading: isLoadingNonce } = useUserNonce();

  const isCorrectNetwork = chainId === STATUS_NETWORK_SEPOLIA_CHAIN_ID;

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  if (!address) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 border border-white/20 rounded-lg p-4 max-w-md shadow-xl z-50">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-bold text-white">🔍 Withdrawal Debug Info</h3>
        <button
          onClick={() => {
            const el = document.getElementById('withdrawal-debug');
            if (el) el.style.display = 'none';
          }}
          className="text-white/60 hover:text-white text-xs"
        >
          ✕
        </button>
      </div>

      <div className="space-y-2 text-xs">
        <div className="flex justify-between items-center">
          <span className="text-white/60">Network:</span>
          <span className={isCorrectNetwork ? 'text-green-400' : 'text-red-400'}>
            {isCorrectNetwork ? '✅ Status L2 Sepolia' : `❌ Wrong Network (${chainId})`}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-white/60">Wallet:</span>
          <span className={isConnected ? 'text-green-400' : 'text-red-400'}>
            {isConnected ? '✅ Connected' : '❌ Not Connected'}
          </span>
        </div>

        <div className="border-t border-white/10 my-2" />

        <div className="flex justify-between">
          <span className="text-white/60">Contract:</span>
          <span className="text-white font-mono text-[10px]">
            {StatusL2Withdrawl.contractAddress.slice(0, 6)}...{StatusL2Withdrawl.contractAddress.slice(-4)}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-white/60">Token (STT):</span>
          <span className="text-white font-mono text-[10px]">
            {STT_TOKEN_ADDRESS.slice(0, 6)}...{STT_TOKEN_ADDRESS.slice(-4)}
          </span>
        </div>

        <div className="border-t border-white/10 my-2" />

        <div className="flex justify-between">
          <span className="text-white/60">Server Signer:</span>
          {isLoadingSigner ? (
            <span className="text-white/40">Loading...</span>
          ) : (
            <span className="text-white font-mono text-[10px]">
              {serverSigner ? `${serverSigner.slice(0, 6)}...${serverSigner.slice(-4)}` : 'Unknown'}
            </span>
          )}
        </div>

        <div className="flex justify-between">
          <span className="text-white/60">Contract Paused:</span>
          {isLoadingPaused ? (
            <span className="text-white/40">Loading...</span>
          ) : (
            <span className={isPaused ? 'text-red-400' : 'text-green-400'}>
              {isPaused ? '⚠️ YES' : '✅ NO'}
            </span>
          )}
        </div>

        <div className="flex justify-between">
          <span className="text-white/60">Contract Balance:</span>
          {isLoadingBalance ? (
            <span className="text-white/40">Loading...</span>
          ) : contractBalance !== undefined ? (
            <span className={Number(formatUnits(contractBalance, 18)) > 10 ? 'text-green-400' : 'text-red-400'}>
              {formatUnits(contractBalance, 18)} STT
            </span>
          ) : (
            <span className="text-white/40">Unknown</span>
          )}
        </div>

        <div className="flex justify-between">
          <span className="text-white/60">Your Nonce:</span>
          {isLoadingNonce ? (
            <span className="text-white/40">Loading...</span>
          ) : (
            <span className="text-white">{nonce?.toString() || '0'}</span>
          )}
        </div>

        <div className="border-t border-white/10 my-2" />

        <div className="text-[10px] text-white/40 leading-relaxed">
          💡 Tip: Server Signer from your .env must match the contract's serverSigner address
        </div>
      </div>
    </div>
  );
}

