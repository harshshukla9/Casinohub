// Main CasinoVault hooks
export {
  useDeposit,
  usePlayerDeposits,
  useVaultBalance,
  useVaultOwner,
  useDepositEvents,
  usePlayerDepositEvents,
  type DepositEvent,
  type UseDepositOptions,
  type UseDepositEventsOptions,
} from './useCasinoVault'

// Owner-specific hooks
export {
  useFundVault,
  useEmergencyWithdraw,
  useTransferOwnership,
  type UseVaultOwnerOptions,
} from './useVaultOwner'

// ERC20 token hooks
export {
  useTokenBalance,
  useTokenAllowance,
  useApproveToken,
  useApproveTokenMax,
  type UseERC20Options,
} from './useERC20'

// Withdrawal hooks
export {
  useUserNonce,
  useIsSignatureUsed,
  useWithdrawalContractBalance,
  useClaimWithdrawal,
  useVerifySignature,
} from './useWithdrawal'

// Server signer hooks
export {
  useServerSigner,
  useContractPaused,
} from './useServerSigner'

// Admin/Owner hooks for withdrawal contract
export {
  useUpdateServerSigner,
  useSetPaused,
  useWaitForUpdate,
} from './useUpdateServerSigner'

// Re-export contract configuration for convenience
export { MonadVault, STT_TOKEN_ADDRESS, ERC20_ABI, StatusL2Withdrawl } from '../lib/contract'

// Export ready-to-use components
export { DepositComponent } from './DepositComponent'
