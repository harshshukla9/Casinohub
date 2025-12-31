// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Script.sol";
import "../src/RandomnessConsumer.sol";

contract DeployScript is Script {
    // Network configurations
    address constant SWITCHBOARD_MONAD_TESTNET = 0xD3860E2C66cBd5c969Fa7343e6912Eff0416bA33;
    address constant SWITCHBOARD_MONAD_MAINNET = 0xB7F03eee7B9F56347e32cC71DaD65B303D5a0E67;
    address constant SWITCHBOARD_HYPERLIQUID = 0xcDb299Cb902D1E39F83F54c7725f54eDDa7F3347;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address switchboardAddress;

        // Determine network from environment or use testnet by default
        string memory network = vm.envOr("NETWORK", string("monad-testnet"));
        
        if (keccak256(bytes(network)) == keccak256(bytes("monad-testnet"))) {
            switchboardAddress = SWITCHBOARD_MONAD_TESTNET;
        } else if (keccak256(bytes(network)) == keccak256(bytes("monad-mainnet"))) {
            switchboardAddress = SWITCHBOARD_MONAD_MAINNET;
        } else if (keccak256(bytes(network)) == keccak256(bytes("hyperliquid-mainnet"))) {
            switchboardAddress = SWITCHBOARD_HYPERLIQUID;
        } else {
            revert("Unknown network");
        }

        vm.startBroadcast(deployerPrivateKey);

        RandomnessConsumer consumer = new RandomnessConsumer(switchboardAddress);

        vm.stopBroadcast();

        console.log("RandomnessConsumer deployed at:", address(consumer));
        console.log("Switchboard address:", switchboardAddress);
        console.log("Network:", network);
    }
}

