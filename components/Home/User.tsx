import { DepositButton } from './DepositButton'
import { UserBalance } from './UserBalance'

export function User() {
  return (
    <div className="space-y-4">
      {/* User Balance */}
      <UserBalance />

      {/* Deposit Button */}
      <div className="border border-[#333] rounded-md p-4">
        <h2 className="text-xl font-bold text-left mb-4">Deposit STT</h2>
        <p className="text-sm text-gray-600 mb-4">
          Deposit STT tokens to your casino vault. Your deposit will be automatically tracked in both the smart contract and our database.
        </p>
        <DepositButton />
      </div>
    </div>
  )
}
