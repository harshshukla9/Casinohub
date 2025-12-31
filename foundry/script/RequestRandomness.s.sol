// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Script.sol";
import "../src/RandomnessConsumer.sol";

contract RequestRandomnessScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address consumerAddress = vm.envAddress("CONSUMER_ADDRESS");

        vm.startBroadcast(deployerPrivateKey);

        RandomnessConsumer consumer = RandomnessConsumer(payable(consumerAddress));

        // Generate a unique randomness ID
        bytes32 randomnessId = keccak256(
            abi.encodePacked("randomness-", block.timestamp, "-", block.number)
        );
        uint64 minSettlementDelay = 5; // 5 seconds

        address oracle = consumer.requestRandomness(randomnessId, minSettlementDelay);

        vm.stopBroadcast();

        console.log("Randomness ID:", vm.toString(randomnessId));
        console.log("Oracle address:", oracle);
        console.log("Min Settlement Delay:", minSettlementDelay);
        console.log("\nNext steps:");
        console.log("1. Wait for settlement delay");
        console.log("2. Fetch randomness from Crossbar");
        console.log("3. Call settleRandomness with encoded data");
    }
}

