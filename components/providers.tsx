'use client'

import { WalletProvider } from '@/components/wallet-provider'
import { Toaster } from '@/components/ui/sonner'
import { SocketProvider } from '@/context/socketcontext'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WalletProvider>
      <SocketProvider>
        {children}
        <Toaster position="bottom-center" />
      </SocketProvider>
    </WalletProvider>
  )
}
