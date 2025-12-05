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

// Re-export contract configuration for convenience
export { MonadVault } from '../lib/contract'

// Export ready-to-use components
export { DepositComponent } from './DepositComponent'
