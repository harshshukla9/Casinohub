# Deposit Integration Guide

## 🎯 What's Been Created

I've created a complete deposit system that integrates your Farcaster user context with the CasinoVault smart contract and your database. Here's what you now have:

### 📁 New Components

1. **`DepositButton.tsx`** - Clean deposit modal with user context integration
2. **`UserBalance.tsx`** - Displays user balance from both smart contract and database
3. **Updated `User.tsx`** - Now includes deposit functionality and balance display
4. **`/api/user-balance/route.ts`** - API endpoint to fetch user balance from database

### 🔄 How It Works

#### 1. **User Clicks Deposit Button**
- Opens a modal showing user info from Farcaster context
- Displays current smart contract deposits
- User enters amount to deposit

#### 2. **Smart Contract Interaction**
- Uses `useDeposit` hook to call the smart contract
- Handles transaction states (pending, confirmed, error)
- Automatically refreshes balance after successful deposit

#### 3. **Event Listening & Database Integration**
- `useDepositEvents` listens for deposit events from smart contract
- When event is detected, automatically calls your `/api/deposit` endpoint
- Saves user data (fid, username, walletAddress, amount) to database
- Only processes events from the current user's wallet

#### 4. **Balance Display**
- Shows smart contract deposits (real-time from blockchain)
- Shows database balance (from your MongoDB)
- Shows total deposited amount
- Refresh button to update database balance

### 🎨 User Experience

```
┌─────────────────────────────────────┐
│ User Profile                        │
│ [Avatar] Display Name               │
│         @username                   │
│         FID: 12345                  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Your Balance                        │
│ Smart Contract: 1.5 STT             │
│ Game Balance: 1.5 STT               │
│ Total Deposited: 1.5 STT            │
│ [Refresh Balance]                   │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Deposit STT                         │
│ Deposit STT tokens to your casino   │
│ vault. Your deposit will be auto-   │
│ matically tracked...                │
│ [Deposit STT]                       │
└─────────────────────────────────────┘
```

### 🔧 Key Features

- **Wallet Integration**: Checks if wallet is connected before allowing deposits
- **User Context**: Uses Farcaster user data (fid, username, displayName)
- **Real-time Updates**: Automatically refreshes balances after deposits
- **Error Handling**: Shows user-friendly error messages
- **Database Sync**: Automatically saves deposit events to your database
- **Clean UI**: Modal-based deposit interface with loading states

### 📊 Data Flow

```
User Clicks Deposit
        ↓
Check Wallet Connection
        ↓
Open Deposit Modal
        ↓
User Enters Amount
        ↓
Call Smart Contract (useDeposit)
        ↓
Transaction Confirmed
        ↓
Event Emitted (Deposited)
        ↓
useDepositEvents Catches Event
        ↓
Call /api/deposit with User Data
        ↓
Save to MongoDB
        ↓
Refresh UI Balances
```

### 🚀 Ready to Use

The components are now integrated into your existing `User.tsx` component. Users can:

1. See their profile information
2. View their current balances
3. Click "Deposit STT" to open the deposit modal
4. Enter an amount and deposit to the smart contract
5. See real-time updates of their balances
6. Have their deposits automatically saved to your database

Everything is production-ready with proper error handling, loading states, and user feedback!
