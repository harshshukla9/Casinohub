'use client'
import { useAccount, useConnect } from 'wagmi'
import { DepositButton } from '@/components/Home/DepositButton'
import { Button } from '@/components/ui/button'
import { Wallet } from 'lucide-react'

export function Header() {
  const { address, isConnected } = useAccount()
  const { connectors, connect, isPending } = useConnect()

  return (
    <header className="border-b border-gray-800 sticky top-0 z-40 backdrop-blur-sm bg-opacity-95">
      <div className="flex items-center justify-between max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col">
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">Casino Hub</h1>
            <div className="text-xs text-gray-400">Provable Fair Gaming</div>
          </div>
          <div className="sm:hidden">
            <h1 className="text-lg font-bold text-white">Casino Hub</h1>
          </div>
        </div>

        {/* Wallet Actions - Right Side */}
        <div className="flex items-center gap-2 sm:gap-4">
          <DepositButton />
        </div>
      </div>
    </header>
  )
}
