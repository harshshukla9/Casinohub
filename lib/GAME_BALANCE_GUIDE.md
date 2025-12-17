# Unified Game Balance System

## Overview
All games now use a unified balance system where:
- Users deposit once via `/api/deposit`
- Balance is stored in MongoDB
- All games use the same balance
- Betting deducts from balance via `/api/bet`
- Winnings are added via `/api/cashout`
- Withdrawals use `/api/withdraw`

## API Endpoints

### 1. Get User Balance
```
GET /api/user-balance?walletAddress=0x...
Response: { user: { balance, totalDeposited, totalWithdrawn, totalBets, totalWinnings } }
```

### 2. Place Bet (All Games)
```
POST /api/bet
Body: { walletAddress, betAmount }
Response: { success, newBalance, betAmount, message }
```

### 3. Cashout/Win (All Games)
```
POST /api/cashout
Body: { walletAddress, betAmount, multiplier }
Response: { success, newBalance, winnings, multiplier, message }
```

### 4. Deposit
```
POST /api/deposit
Body: { walletAddress, amount, transactionHash, fid?, username? }
Response: { success, user, transactionHash }
```

### 5. Withdraw
```
POST /api/withdraw
Body: { walletAddress, amount, fid?, username? }
Response: { success, withdrawalId, amount, newBalance, signature, nonce, ... }
```

## Usage in Games

### Using the Hook
```typescript
import { useUserBalance } from '@/hooks/useUserBalance'
import { useAccount } from 'wagmi'
import { placeBet, cashout, hasSufficientBalance } from '@/lib/game-balance'

function MyGame() {
  const { address } = useAccount()
  const { balance, isLoading, refetch } = useUserBalance()
  
  const handleBet = async () => {
    if (!address) return
    if (!hasSufficientBalance(balance, betAmount)) {
      alert('Insufficient balance')
      return
    }
    
    const result = await placeBet(address, betAmount)
    if (result.success) {
      // Game logic here
    }
  }
  
  const handleWin = async (multiplier: number) => {
    if (!address) return
    const result = await cashout(address, betAmount, multiplier)
    if (result.success) {
      // Show win message
    }
  }
}
```

### Display Balance
```typescript
import { GameBalanceDisplay } from '@/components/shared/GameBalanceDisplay'

// In your game component
<GameBalanceDisplay />
```

## Events
The system dispatches events that components can listen to:
- `balanceUpdated` - Balance changed
- `betPlaced` - Bet was placed
- `cashoutCompleted` - Cashout completed
- `depositCompleted` - Deposit completed
- `withdrawCompleted` - Withdrawal completed

## Notes
- Balance is checked server-side before deducting
- All games share the same balance
- Balance updates are real-time via events
- No need for game-specific balance management

