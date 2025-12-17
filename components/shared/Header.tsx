'use client'
import { useAccount, useConnect } from 'wagmi'
import { DepositButton } from '@/components/Home/DepositButton'
import { Button } from '@/components/ui/button'

export function Header() {
  const { address, isConnected } = useAccount()
  const { connectors, connect, isPending } = useConnect()

  return (
    <header className="bg-black/80 border-b border-white/10 px-4 py-3">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-white">Status Mines</h1>
          <div className="text-sm text-white/60">
            Provable Fair Gaming
          </div>
        </div>

        <div className="flex items-center gap-4">
          {isConnected && address ? (
            <div className="flex items-center gap-3">
              <div className="text-sm text-white/80">
                {`${address.slice(0, 6)}...${address.slice(-4)}`}
              </div>
              <DepositButton />
            </div>
          ) : (
            <Button
              onClick={() => connect({ connector: connectors[0] })}
              disabled={isPending}
              className="bg-[#00ffaa] hover:bg-[#00e699] text-black font-semibold"
            >
              {isPending ? 'Connecting...' : 'Connect Wallet'}
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
