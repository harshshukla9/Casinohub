import { statusNetworkSepolia } from 'viem/chains'
import { formatEther } from 'viem'
import { useAccount, useBalance, useDisconnect } from 'wagmi'
import { useAppKit } from '@reown/appkit/react'
import { useState, useEffect } from 'react'


export function WalletActions() {
  const { isConnected, address, connector } = useAccount()
  const { disconnect } = useDisconnect()
  const { open } = useAppKit()
  const { data: balance, isLoading } = useBalance({
    address,
    chainId: statusNetworkSepolia.id,
    // watch: true,
  })

  const shortenAddress = (addr?: string) =>
    addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : ''

  // Fix hydration issue by only rendering after mount
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  // Debug logging
  console.log('WalletActions state:', { 
    isConnected, 
    address, 
    mounted,
    connector: connector?.name,
  })

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="w-full">
        <div className="h-10 bg-white/10 rounded-lg animate-pulse" />
      </div>
    )
  }

  // Check if connected first
  if (isConnected && address) {
    return (
      <div className="w-full">
        <div className="bg-white/10 border border-white/20 rounded-lg px-3 py-2">
          <p className="text-xs text-white/60 mb-1">Connected</p>
          <p className="text-sm font-mono text-white font-medium">
            {shortenAddress(address)}
          </p>
        </div>
      </div>
    )
  }

  // Show connect button if not connected
  return (
    <button
      type="button"
      className="w-full bg-white text-[#240B53] rounded-lg px-4 py-2.5 text-sm font-semibold hover:bg-white/90 transition-colors"
      onClick={() => open()}
    >
      Connect Wallet
    </button>
  )
}
