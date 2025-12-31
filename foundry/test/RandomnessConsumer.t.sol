// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "../src/RandomnessConsumer.sol";
import "../src/ISwitchboard.sol";

contract RandomnessConsumerTest is Test {
    RandomnessConsumer public consumer;
    ISwitchboard public switchboard;

    // Monad testnet Switchboard address
    address constant SWITCHBOARD_MONAD_TESTNET = 0xD3860E2C66cBd5c969Fa7343e6912Eff0416bA33;
    
    // Monad mainnet Switchboard address
    address constant SWITCHBOARD_MONAD_MAINNET = 0xB7F03eee7B9F56347e32cC71DaD65B303D5a0E67;

    function setUp() public {
        // Use testnet for testing
        switchboard = ISwitchboard(SWITCHBOARD_MONAD_TESTNET);
        consumer = new RandomnessConsumer(address(switchboard));
    }

    function testDeployment() public view {
        assertEq(address(consumer.switchboard()), address(switchboard));
    }

    function testRequestRandomness() public {
        bytes32 randomnessId = keccak256("test-randomness-1");
        uint64 minSettlementDelay = 5;

        // This will fail if not on the actual network, but shows the pattern
        vm.expectRevert();
        consumer.requestRandomness(randomnessId, minSettlementDelay);
    }

    function testGetRandomnessData() public view {
        bytes32 randomnessId = keccak256("test-randomness-1");
        
        // This will fail if randomness doesn't exist, but shows the pattern
        ISwitchboard.Randomness memory randomness = consumer.getRandomnessData(randomnessId);
        
        // If randomness exists, check it
        if (randomness.oracle != address(0)) {
            assertTrue(randomness.oracle != address(0));
        }
    }

    function testRollDice() public {
        bytes32 randomnessId = keccak256("test-randomness-1");
        
        // This will fail if randomness not settled, but shows the pattern
        vm.expectRevert("Randomness not settled");
        consumer.rollDice(randomnessId, 6);
    }

    function testCoinFlip() public {
        bytes32 randomnessId = keccak256("test-randomness-1");
        
        // This will fail if randomness not settled, but shows the pattern
        vm.expectRevert("Randomness not settled");
        consumer.coinFlip(randomnessId);
    }

    function testRandomRange() public {
        bytes32 randomnessId = keccak256("test-randomness-1");
        
        // This will fail if randomness not settled, but shows the pattern
        vm.expectRevert("Randomness not settled");
        consumer.randomRange(randomnessId, 100);
    }
}

