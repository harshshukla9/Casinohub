// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Script.sol";
import "../src/RandomnessConsumer.sol";

contract SettleRandomnessScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address consumerAddress = vm.envAddress("CONSUMER_ADDRESS");
        bytes32 randomnessId = vm.envBytes32("RANDOMNESS_ID");
        bytes memory encodedRandomness = vm.envBytes("ENCODED_RANDOMNESS");

        vm.startBroadcast(deployerPrivateKey);

        RandomnessConsumer consumer = RandomnessConsumer(payable(consumerAddress));

        // Get the fee required
        uint256 fee = consumer.switchboard().updateFee();
        console.log("Update fee required:", fee);

        // Settle the randomness
        consumer.settleRandomness{value: fee}(randomnessId, encodedRandomness);

        vm.stopBroadcast();

        // Get the settled value
        uint256 randomValue = consumer.getRandomValue(randomnessId);
        console.log("Random value settled:", randomValue);
        console.log("D6 roll:", consumer.rollDice(randomnessId, 6));
        console.log("D20 roll:", consumer.rollDice(randomnessId, 20));
        console.log("Coin flip:", consumer.coinFlip(randomnessId) ? "Heads" : "Tails");
    }
}

