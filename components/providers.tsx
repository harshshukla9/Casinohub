'use client'

import { WalletProvider } from '@/components/wallet-provider'
import { Toaster } from '@/components/ui/sonner'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WalletProvider>
      {children}
      <Toaster position="bottom-center" />
    </WalletProvider>
  )
}
