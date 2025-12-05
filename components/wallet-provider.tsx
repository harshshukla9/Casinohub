"use client"

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import {  statusNetworkSepolia } from '@reown/appkit/networks'
import { WagmiProvider } from 'wagmi'


// Get Reown/WalletConnect Project ID from environment or use a default
const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || 'demo-project-id'

// Set up Wagmi Adapter
const wagmiAdapter = new WagmiAdapter({
  networks: [statusNetworkSepolia],
  projectId,
  ssr: true,
  connectors: [],
})

// Create AppKit instance
createAppKit({
  adapters: [wagmiAdapter],
  networks: [statusNetworkSepolia],
  projectId,
  metadata: {
    name: 'Dragon Tower',
    description: 'Dragon tower climb the tower to the top',
    url: 'https://dragon-tower-lyart.vercel.app/',
    icons: ['https://dragon-tower-lyart.vercel.app/images/icon.png']
  },
  features: {
    analytics: false, // Disable analytics to prevent extra renders
    email: false, // Disable email login
    socials: false, // Disable social logins
    onramp: false, // Disable on-ramp
  },
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#3b99fc',
    '--w3m-border-radius-master': '16px',
  },
  allWallets: 'SHOW', // Show all available wallets
})

// Export the wagmi config
// This includes all wallets supported by Reown AppKit (MetaMask, Coinbase, etc.)
export const config = wagmiAdapter.wagmiConfig

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      staleTime: 5 * 60 * 1000,
    },
  },
})

export function WalletProvider({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
}
