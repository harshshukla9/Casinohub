"use client"

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { defineChain } from '@reown/appkit/networks'
import { WagmiProvider } from 'wagmi'

// Define Monad Testnet chain
const monadTestnet = defineChain({
  id: 10143,
  caipNetworkId: 'eip155:10143',
  chainNamespace: 'eip155',
  name: 'Monad Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Monad',
    symbol: 'MON',
  },
  rpcUrls: {
    default: {
      http: ['https://testnet-rpc.monad.xyz/'],
      webSocket: [],
    },
  },
  blockExplorers: {
    default: { name: 'Monad Explorer', url: 'https://testnet.monadscan.com' },
  },
  contracts: {},
  testnet: true,
})

// Get Reown/WalletConnect Project ID from environment or use a default
const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || 'demo-project-id'

// Set up Wagmi Adapter for Monad Testnet
const wagmiAdapter = new WagmiAdapter({
  networks: [monadTestnet],
  projectId,
  ssr: true,
  connectors: [],
})

// Create AppKit instance
createAppKit({
  adapters: [wagmiAdapter],
  networks: [monadTestnet],
  projectId,
  metadata: {
    name: 'Karma Mines',
    description: 'Provable Fair Gaming on Monad',
    url: 'https://karma-mines.vercel.app/',
    icons: ['https://karma-mines.vercel.app/images/icon.png']
  },
  features: {
    analytics: false, // Disable analytics to prevent extra renders
    email: false, // Disable email login
    socials: false, // Disable social logins
    onramp: false, // Disable on-ramp
  },
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#836EF9', // Monad purple accent
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
