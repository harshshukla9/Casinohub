# CasinoVault Smart Contract Hooks

This directory contains React hooks for interacting with the CasinoVault smart contract deployed on Monad Testnet.

## Available Hooks

### Player Hooks

#### `useDeposit(options?)`
Make deposits to the vault.

```tsx
const { deposit, isLoading, isConfirmed, error } = useDeposit({
  onSuccess: (txHash) => console.log('Deposit successful:', txHash),
  onError: (error) => console.error('Deposit failed:', error),
})

// Usage
await deposit('1.5') // Deposit 1.5 STT
```

#### `usePlayerDeposits(playerAddress?)`
Get a player's total deposits. If no address is provided, uses the connected account.

```tsx
const { deposits, depositsWei, isLoading, refetch } = usePlayerDeposits()

// deposits is formatted as string (e.g., "1.5")
// depositsWei is the raw BigInt value
```

#### `useVaultBalance()`
Get the vault's total balance.

```tsx
const { balance, balanceWei, isLoading, refetch } = useVaultBalance()
```

#### `useVaultOwner()`
Get the contract owner address.

```tsx
const { owner, isLoading, refetch } = useVaultOwner()
```

### Event Hooks

#### `useDepositEvents(options?)`
Listen for all deposit events.

```tsx
const { events, isLoading, clearEvents } = useDepositEvents({
  onDeposit: (event) => {
    console.log('New deposit:', event)
    // Save to database here
  },
  enabled: true, // optional, defaults to true
})
```

#### `usePlayerDepositEvents(playerAddress?)`
Listen for deposit events from a specific player.

```tsx
const { events, isLoading, clearEvents } = usePlayerDepositEvents()
```

### Owner Hooks

#### `useFundVault(options?)`
Fund the vault (owner only).

```tsx
const { fundVault, isLoading, isConfirmed } = useFundVault({
  onSuccess: (txHash) => console.log('Vault funded:', txHash),
})

await fundVault('10') // Fund with 10 STT
```

#### `useEmergencyWithdraw(options?)`
Emergency withdrawal (owner only).

```tsx
const { emergencyWithdraw, isLoading } = useEmergencyWithdraw()

await emergencyWithdraw()
```

#### `useTransferOwnership(options?)`
Transfer ownership (owner only).

```tsx
const { transferOwnership, isLoading } = useTransferOwnership()

await transferOwnership('0x...') // New owner address
```

## Event Types

```tsx
interface DepositEvent {
  player: string
  amount: bigint
  timestamp: bigint
  transactionHash: string
  blockNumber: bigint
}
```

## Usage Example

```tsx
import { useDeposit, usePlayerDeposits, useDepositEvents } from './smartcontracthooks'

function MyComponent() {
  const { deposit, isLoading } = useDeposit()
  const { deposits } = usePlayerDeposits()
  
  const { events } = useDepositEvents({
    onDeposit: async (event) => {
      // Save to your database
      await fetch('/api/deposits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player: event.player,
          amount: event.amount.toString(),
          timestamp: event.timestamp.toString(),
          transactionHash: event.transactionHash,
        }),
      })
    },
  })

  return (
    <div>
      <p>Your deposits: {deposits} STT</p>
      <button onClick={() => deposit('1')} disabled={isLoading}>
        Deposit 1 STT
      </button>
    </div>
  )
}
```

## Database Integration

The `useDepositEvents` hook is perfect for capturing events and saving them to your database. The `onDeposit` callback receives the full event data including:

- `player`: The depositor's address
- `amount`: Deposit amount in wei
- `timestamp`: Block timestamp
- `transactionHash`: Transaction hash for verification
- `blockNumber`: Block number for additional verification

You can use this data to create a complete audit trail of all deposits in your application.
