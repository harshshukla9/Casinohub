'use client'
import { useUserBalance } from '@/hooks/useUserBalance'
import { useAccount } from 'wagmi'

export function GameBalanceDisplay() {
  const { address } = useAccount()
  const { balance, totalDeposited, totalWithdrawn, isLoading } = useUserBalance()

  if (!address) {
    return null
  }

  return (
    <div className="bg-black/60 border border-white/20 rounded-lg p-3 shadow-lg">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/70">Balance</span>
          <span className="text-lg font-bold text-[#00ffaa]">
            {isLoading ? '...' : `${balance.toFixed(4)} STT`}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-white/50">Deposited:</span>
          <span className="text-green-400">{totalDeposited.toFixed(4)} STT</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-white/50">Withdrawn:</span>
          <span className="text-red-400">{totalWithdrawn.toFixed(4)} STT</span>
        </div>
      </div>
    </div>
  )
}

