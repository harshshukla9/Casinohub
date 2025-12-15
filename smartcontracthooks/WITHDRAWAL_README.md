# Smart Contract Withdrawal System

## Overview

This system implements a secure, signature-based withdrawal mechanism where users can withdraw their STT tokens from the casino platform directly through a smart contract.

## Architecture

### Components

1. **Smart Contract**: `CasinoVault` (StatusL2Withdrawl)
   - Address: `0x26D68B081BC7c15F0d88A85385e151570ed90Ac2`
   - Network: Status L2 Sepolia
   - Chain ID: 11155420

2. **Backend API**: `/api/withdraw`
   - Validates withdrawal requests
   - Deducts user balance immediately
   - Generates cryptographic signature using server's private key
   - Returns signature to frontend

3. **Frontend Hooks**: `useWithdrawal.ts`
   - `useUserNonce()` - Get user's current nonce
   - `useClaimWithdrawal()` - Claim withdrawal with signature
   - `useWaitForWithdrawal()` - Wait for transaction confirmation
   - `useWithdrawalContractBalance()` - Check contract's token balance

4. **UI Component**: `WithdrawButton.tsx`
   - User interface for withdrawal
   - Handles the complete withdrawal flow

## Withdrawal Flow

```
┌─────────────┐
│   User      │
│  Requests   │
│ Withdrawal  │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│  API (/api/withdraw)                │
│  1. Validate amount & balance       │
│  2. Check 24hr cooldown             │
│  3. Deduct balance from DB          │
│  4. Get user's nonce from contract  │
│  5. Generate signature              │
└──────┬──────────────────────────────┘
       │
       │ Returns: { signature, nonce, amount }
       │
       ▼
┌─────────────────────────────────────┐
│  Frontend (WithdrawButton)          │
│  1. Receive signature data          │
│  2. Call claimWithdrawal()          │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Smart Contract                     │
│  1. Verify signature                │
│  2. Check nonce                     │
│  3. Mark signature as used          │
│  4. Transfer STT tokens to user     │
└─────────────────────────────────────┘
```

## Security Features

### 1. Signature-Based Authorization
- Server signs each withdrawal with its private key
- Contract verifies the signature matches the server signer
- Prevents unauthorized withdrawals

### 2. Nonce System
- Each user has an incrementing nonce
- Prevents signature replay attacks
- Nonce must match the user's current on-chain nonce

### 3. Signature Tracking
- Contract tracks all used signatures
- Prevents signature reuse even if nonce is bypassed

### 4. Balance Checks
- API validates user has sufficient balance
- Contract validates it has sufficient tokens
- Double-layer protection

### 5. 24-Hour Cooldown
- Users can only withdraw once per 24 hours
- Implemented at the API level
- Prevents withdrawal spamming

## Signature Format

The signature is generated using ECDSA (secp256k1) over the following message:

```solidity
keccak256(abi.encodePacked(
    userAddress,      // address
    tokenAddress,     // address (STT token)
    amount,           // uint256 (in wei)
    nonce,            // uint256
    contractAddress   // address (CasinoVault)
))
```

This is then signed using Ethereum's personal message format (`eth_sign`).

## Environment Variables

Required in `.env.local`:

```bash
# Server's private key for signing withdrawals
SERVER_PRIVATE_KEY=0x...

# The public key derived from this should match the serverSigner in the contract
```

⚠️ **SECURITY WARNING**: Keep the `SERVER_PRIVATE_KEY` secure. Anyone with this key can authorize withdrawals!

## Contract Functions Used

### Read Functions

- `getUserNonce(address user)` - Get user's current nonce
- `getTokenBalance(address token)` - Check contract's token balance
- `isSignatureUsed(bytes signature)` - Check if signature was already used
- `verifySignature(token, amount, nonce, signature)` - Verify signature validity

### Write Functions

- `claimWithdrawal(token, amount, nonce, signature)` - Claim approved withdrawal

## Usage Example

### Backend (Signing)

```typescript
import { keccak256, encodePacked } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

const account = privateKeyToAccount(SERVER_PRIVATE_KEY);

const messageHash = keccak256(
  encodePacked(
    ['address', 'address', 'uint256', 'uint256', 'address'],
    [userAddress, tokenAddress, amountInWei, nonce, contractAddress]
  )
);

const signature = await account.signMessage({
  message: { raw: messageHash },
});
```

### Frontend (Claiming)

```typescript
import { useClaimWithdrawal } from '@/smartcontracthooks';

const { claimWithdrawal } = useClaimWithdrawal();

// After receiving signature from API
await claimWithdrawal(
  amount.toString(),
  BigInt(nonce),
  signature as `0x${string}`
);
```

## Error Handling

### Common Errors

1. **InvalidSignature** - Signature doesn't match server signer
2. **InvalidNonce** - Nonce doesn't match user's current nonce
3. **SignatureAlreadyUsed** - Signature was already used
4. **InsufficientBalance** - Contract doesn't have enough tokens
5. **ContractIsPaused** - Contract is paused by owner

### Troubleshooting

- **Signature verification fails**: Check that SERVER_PRIVATE_KEY matches the contract's serverSigner
- **Nonce mismatch**: User may have a pending withdrawal, fetch fresh nonce
- **Transaction reverts**: Check contract has sufficient STT tokens

## Testing

To test the withdrawal system:

1. Ensure contract is funded with STT tokens
2. User deposits tokens into platform
3. User requests withdrawal through UI
4. Verify signature is generated correctly
5. Confirm transaction completes on-chain
6. Verify user receives tokens in wallet

## Monitoring

Important events to monitor:

- `TokenWithdrawn(user, token, amount)` - Successful withdrawal
- `ServerSignerUpdated(oldSigner, newSigner)` - Signer address changed
- `ContractPaused(paused)` - Contract pause state changed

## Admin Functions

Contract owner can:

- `updateServerSigner(address)` - Update the server signer address
- `setPaused(bool)` - Pause/unpause the contract
- `ownerWithdraw(token, amount)` - Withdraw tokens for contract management
- `ownerWithdrawBatch(tokens[], amounts[])` - Batch withdraw (gas efficient)

## References

- Contract: `lib/contract.ts` - `StatusL2Withdrawl`
- Hooks: `smartcontracthooks/useWithdrawal.ts`
- API: `app/api/withdraw/route.ts`
- UI: `components/Home/WithdrawButton.tsx`

