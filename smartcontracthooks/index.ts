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

// Re-export contract configuration for convenience
export { MonadVault, STT_TOKEN_ADDRESS, ERC20_ABI } from '../lib/contract'

// Export ready-to-use components
export { DepositComponent } from './DepositComponent'
