# Switchboard Randomness - Foundry Implementation

A Foundry implementation of Switchboard randomness consumer for Monad and other EVM chains.

## Overview

This Foundry project implements a `RandomnessConsumer` contract that interacts with Switchboard's randomness oracle to generate verifiable random numbers on-chain.

## Project Structure

```
foundry/
├── src/
│   ├── ISwitchboard.sol          # Switchboard interface
│   └── RandomnessConsumer.sol    # Main consumer contract
├── script/
│   ├── Deploy.s.sol              # Deployment script
│   ├── RequestRandomness.s.sol  # Request randomness script
│   └── SettleRandomness.s.sol    # Settle randomness script
├── test/
│   └── RandomnessConsumer.t.sol  # Tests
└── foundry.toml                  # Foundry configuration
```

## Setup

1. **Install Foundry** (if not already installed):
   ```bash
   curl -L https://foundry.paradigm.xyz | bash
   foundryup
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env and add your PRIVATE_KEY
   ```

3. **Build the project**:
   ```bash
   forge build
   ```

## Usage

### 1. Deploy the Consumer Contract

```bash
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url $MONAD_TESTNET_RPC \
  --broadcast \
  --verify
```

Or set network in `.env`:
```bash
NETWORK=monad-testnet forge script script/Deploy.s.sol:DeployScript --rpc-url monad_testnet --broadcast
```

### 2. Request Randomness

After deployment, save the `CONSUMER_ADDRESS` in your `.env` file, then:

```bash
forge script script/RequestRandomness.s.sol:RequestRandomnessScript \
  --rpc-url monad_testnet \
  --broadcast
```

This will:
- Generate a unique randomness ID
- Call `requestRandomness` on your consumer contract
- Return the oracle address assigned

### 3. Fetch from Crossbar (Off-Chain)

Use the TypeScript implementation in the parent directory to fetch the encoded randomness from Crossbar:

```bash
cd ..
npm run dev
```

Or use the Crossbar API directly with:
- `randomnessId` (from step 2)
- `rollTimestamp` (from `getRandomnessData`)
- `oracle` (from step 2)
- `minSettlementDelay` (from your request)

### 4. Settle Randomness On-Chain

Once you have the encoded randomness from Crossbar:

```bash
# Set in .env:
# RANDOMNESS_ID=0x...
# ENCODED_RANDOMNESS=0x...

forge script script/SettleRandomness.s.sol:SettleRandomnessScript \
  --rpc-url monad_testnet \
  --broadcast
```

### 5. Use the Random Value

After settling, the random value is available in your contract:

```solidity
// Get the raw value
uint256 value = consumer.getRandomValue(randomnessId);

// Use utility functions
uint256 d6 = consumer.rollDice(randomnessId, 6);
uint256 d20 = consumer.rollDice(randomnessId, 20);
bool heads = consumer.coinFlip(randomnessId);
uint256 range = consumer.randomRange(randomnessId, 100);
```

## Contract Functions

### RandomnessConsumer

- `requestRandomness(bytes32 randomnessId, uint64 minSettlementDelay)` - Request randomness
- `getRandomnessData(bytes32 randomnessId)` - Get randomness data from Switchboard
- `checkRandomnessReady(bytes32 randomnessId)` - Check if ready to settle
- `settleRandomness(bytes32 randomnessId, bytes calldata encodedRandomness)` - Settle randomness
- `getRandomValue(bytes32 randomnessId)` - Get settled random value
- `rollDice(bytes32 randomnessId, uint256 sides)` - Roll dice (1 to sides)
- `coinFlip(bytes32 randomnessId)` - Coin flip (true = heads)
- `randomRange(bytes32 randomnessId, uint256 max)` - Random number 0 to max-1

## Testing

Run tests:

```bash
forge test
```

Run with verbose output:

```bash
forge test -vvv
```

## Networks

### Monad Testnet
- Chain ID: 10143
- RPC: `https://testnet-rpc.monad.xyz`
- Switchboard: `0xD3860E2C66cBd5c969Fa7343e6912Eff0416bA33`
- ⚠️ **Note**: The randomness contract may not be deployed on testnet. Check with Switchboard team or use mainnet.

### Monad Mainnet
- Chain ID: 143
- RPC: `https://rpc.monad.xyz`
- Switchboard: `0xB7F03eee7B9F56347e32cC71DaD65B303D5a0E67`

### Hyperliquid Mainnet
- Chain ID: 999
- RPC: `https://rpc.hyperliquid.xyz/evm`
- Switchboard: `0xcDb299Cb902D1E39F83F54c7725f54eDDa7F3347`

## Integration with TypeScript

This Foundry implementation works together with the TypeScript implementation in the parent directory:

1. **Deploy contract** (Foundry)
2. **Request randomness** (Foundry)
3. **Fetch from Crossbar** (TypeScript)
4. **Settle on-chain** (Foundry)
5. **Use random value** (Foundry)

See the parent `README.md` for TypeScript usage.

## Security Notes

- Never commit your `.env` file
- Always verify contracts on block explorers
- Test on testnet before mainnet
- Ensure sufficient balance for gas and fees

## License

MIT
