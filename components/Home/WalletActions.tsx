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
      <button
        type="button"
        className="bg-white text-black w-full rounded-lg p-2 text-sm font-medium"
        disabled
      >
        Loading...
      </button>
    )
  }

  // Check if connected first
  if (isConnected && address) {
    return (
      <div className="border border-[#333] rounded-xl p-3 space-y-2">
        <p className="text-xs text-gray-300 text-center">
          <span className="bg-white text-black font-mono rounded-md px-2 py-1.5">
            {shortenAddress(address)}
          </span>
        </p>
        
        <button
          type="button"
          className="bg-red-500 hover:bg-red-600 text-white w-full rounded-lg p-2 text-sm font-medium active:scale-95 transition"
          onClick={() => disconnect()}
        >
          Disconnect Wallet
        </button>
      </div>
    )
  }

  // Show connect button if not connected
  return (
    <button
      type="button"
      className="bg-white text-black w-full rounded-lg p-2 text-sm font-medium active:scale-95 transition"
      onClick={() => open()}
    >
      Connect Wallet
    </button>
  )
}
