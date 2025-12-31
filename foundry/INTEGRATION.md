# Foundry + TypeScript Integration Guide

This guide shows how to use the Foundry contracts together with the TypeScript implementation for a complete randomness flow.

## Complete Flow

### Step 1: Deploy Contract (Foundry)

```bash
cd foundry
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url monad_testnet \
  --broadcast \
  --private-key 
```

Save the deployed contract address to `foundry/.env`:
```
CONSUMER_ADDRESS=0x...
```

### Step 2: Request Randomness (Foundry)

```bash
forge script script/RequestRandomness.s.sol:RequestRandomnessScript \
  --rpc-url monad_testnet \
  --broadcast \
  --private-key 
```

This outputs:
- `randomnessId` - Save this!
- `oracle` - The oracle address

### Step 3: Fetch from Crossbar (TypeScript)

Go back to the parent directory and use the TypeScript implementation:

```bash
cd ..
# Edit src/index.ts or create a script that uses the randomnessId from step 2
```

Or create a helper script:

```typescript
// src/fetch-randomness.ts
import { MonadRandomness } from './randomness.js';
import 'dotenv/config';

const randomnessId = process.argv[2]; // From step 2
const networkName = process.env.NETWORK || 'monad-testnet';
const privateKey = process.env.PRIVATE_KEY!;

const randomness = new MonadRandomness(networkName, privateKey);

// Get randomness data to extract rollTimestamp and oracle
const data = await randomness.getRandomnessData(randomnessId);

// Wait for settlement delay
await randomness.waitForSettlementDelay(randomnessId);

// Fetch from Crossbar
const { encoded } = await randomness.fetchRandomnessFromCrossbar(randomnessId, data);

console.log(`Encoded randomness: ${encoded}`);
// Save this for step 4!
```

### Step 4: Settle Randomness (Foundry)

Add to `foundry/.env`:
```
RANDOMNESS_ID=0x... (from step 2)
ENCODED_RANDOMNESS=0x... (from step 3)
```

Then settle:

```bash
cd foundry
forge script script/SettleRandomness.s.sol:SettleRandomnessScript \
  --rpc-url monad_testnet \
  --broadcast \
  --private-key $PRIVATE_KEY
```

### Step 5: Use Random Value (Foundry)

The random value is now available in your contract. You can call:

```solidity
// In your contract or via cast
uint256 value = consumer.getRandomValue(randomnessId);
uint256 d6 = consumer.rollDice(randomnessId, 6);
bool heads = consumer.coinFlip(randomnessId);
```

## Quick Script

Create a helper script to automate steps 2-4:

```bash
#!/bin/bash
# scripts/complete-randomness.sh

cd foundry

# Step 1: Request
echo "Requesting randomness..."
RANDOMNESS_ID=$(forge script script/RequestRandomness.s.sol:RequestRandomnessScript \
  --rpc-url monad_testnet \
  --broadcast \
  --private-key $PRIVATE_KEY | grep "Randomness ID:" | awk '{print $3}')

echo "Randomness ID: $RANDOMNESS_ID"

# Step 2: Wait and fetch (TypeScript)
echo "Waiting for settlement delay and fetching from Crossbar..."
cd ..
ENCODED=$(npm run fetch -- $RANDOMNESS_ID)
cd foundry

# Step 3: Settle
echo "Settling randomness..."
forge script script/SettleRandomness.s.sol:SettleRandomnessScript \
  --rpc-url monad_testnet \
  --broadcast \
  --private-key $PRIVATE_KEY \
  --sig "run()" \
  --env RANDOMNESS_ID=$RANDOMNESS_ID \
  --env ENCODED_RANDOMNESS=$ENCODED

echo "Done! Randomness settled."
```

## Testing Locally

You can test the contract logic locally with Foundry:

```bash
cd foundry
forge test -vvv
```

Note: Tests that interact with the actual Switchboard contract will fail unless you're on the correct network. Use `forge test --fork-url $RPC_URL` to test against a forked network.

## Network Configuration

The contracts support multiple networks. Set `NETWORK` in `.env`:

- `monad-testnet` - Monad Testnet (Chain ID: 10143)
- `monad-mainnet` - Monad Mainnet (Chain ID: 143)  
- `hyperliquid-mainnet` - Hyperliquid Mainnet (Chain ID: 999)

## Troubleshooting

### Contract deployment fails
- Ensure you have sufficient balance for gas
- Check the RPC endpoint is correct
- Verify the Switchboard address for your network

### Randomness request fails
- Check the Switchboard contract address is correct
- Ensure you're on the right network
- Verify the oracle is active (see parent README troubleshooting)

### Settlement fails
- Ensure you've waited the full settlement delay
- Verify the encoded randomness from Crossbar is correct
- Check you have sufficient balance for the update fee

## Architecture

```
┌─────────────┐
│   Foundry   │  Deploy contract, request randomness
│  Contracts  │  Settle randomness, use random value
└──────┬──────┘
       │
       │ (on-chain)
       │
┌──────▼──────────────────┐
│  Switchboard Contract   │
│  (Monad/Hyperliquid)    │
└──────┬──────────────────┘
       │
       │ (off-chain)
       │
┌──────▼──────────┐
│  TypeScript    │  Fetch encoded randomness
│  + Crossbar    │  Handle settlement delay
└────────────────┘
```

The Foundry contracts handle all on-chain operations, while the TypeScript code handles the off-chain Crossbar API interaction.

