// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./ISwitchboard.sol";

/**
 * @title RandomnessConsumer
 * @dev A contract that consumes randomness from Switchboard
 * This contract demonstrates the complete flow of requesting and using randomness
 */
contract RandomnessConsumer {
    ISwitchboard public immutable switchboard;

    // Mapping to track randomness requests
    mapping(bytes32 => bool) public randomnessRequested;
    mapping(bytes32 => uint256) public randomnessValues;
    mapping(bytes32 => bool) public randomnessSettled;

    // Events
    event RandomnessRequested(bytes32 indexed randomnessId, address indexed oracle);
    event RandomnessSettled(bytes32 indexed randomnessId, uint256 value);

    constructor(address _switchboard) {
        require(_switchboard != address(0), "Invalid switchboard address");
        switchboard = ISwitchboard(_switchboard);
    }

    /**
     * @dev Request randomness from Switchboard
     * @param randomnessId Unique identifier for this randomness request
     * @param minSettlementDelay Minimum delay before randomness can be settled (in seconds)
     * @return oracle The oracle address assigned to this randomness request
     */
    function requestRandomness(
        bytes32 randomnessId,
        uint64 minSettlementDelay
    ) external returns (address oracle) {
        require(!randomnessRequested[randomnessId], "Randomness already requested");

        // Create randomness request on Switchboard
        oracle = switchboard.createRandomness(randomnessId, minSettlementDelay);

        randomnessRequested[randomnessId] = true;

        emit RandomnessRequested(randomnessId, oracle);
    }

    /**
     * @dev Get randomness data from Switchboard
     * @param randomnessId The randomness ID to query
     * @return randomness The randomness data structure
     */
    function getRandomnessData(
        bytes32 randomnessId
    ) external view returns (ISwitchboard.Randomness memory) {
        return switchboard.getRandomness(randomnessId);
    }

    /**
     * @dev Check if randomness is ready for settlement
     * @param randomnessId The randomness ID to check
     * @return ready True if randomness is ready to be settled
     */
    function checkRandomnessReady(
        bytes32 randomnessId
    ) external view returns (bool ready) {
        return switchboard.isRandomnessReady(randomnessId);
    }

    /**
     * @dev Settle randomness on-chain using encoded randomness from Crossbar
     * @param randomnessId The randomness ID being settled
     * @param encodedRandomness The encoded randomness data from Crossbar
     */
    function settleRandomness(
        bytes32 randomnessId,
        bytes calldata encodedRandomness
    ) external payable {
        require(randomnessRequested[randomnessId], "Randomness not requested");
        require(!randomnessSettled[randomnessId], "Randomness already settled");

        // Get the update fee required
        uint256 fee = switchboard.updateFee();
        require(msg.value >= fee, "Insufficient fee");

        // Settle the randomness
        switchboard.settleRandomness{value: fee}(encodedRandomness);

        // Get the settled value
        ISwitchboard.Randomness memory randomness = switchboard.getRandomness(
            randomnessId
        );
        require(randomness.settledAt > 0, "Randomness not settled");

        randomnessValues[randomnessId] = randomness.value;
        randomnessSettled[randomnessId] = true;

        emit RandomnessSettled(randomnessId, randomness.value);
    }

    /**
     * @dev Get the settled random value
     * @param randomnessId The randomness ID
     * @return value The random value (0 if not settled yet)
     */
    function getRandomValue(bytes32 randomnessId) external view returns (uint256) {
        return randomnessValues[randomnessId];
    }

    /**
     * @dev Use the random value for a specific purpose (example: dice roll)
     * @param randomnessId The randomness ID
     * @param sides Number of sides (e.g., 6 for D6, 20 for D20)
     * @return result The dice roll result (1 to sides)
     */
    function rollDice(
        bytes32 randomnessId,
        uint256 sides
    ) external view returns (uint256) {
        require(randomnessSettled[randomnessId], "Randomness not settled");
        require(sides > 0, "Invalid sides");

        uint256 value = randomnessValues[randomnessId];
        return (value % sides) + 1;
    }

    /**
     * @dev Use the random value for coin flip
     * @param randomnessId The randomness ID
     * @return heads True if heads, false if tails
     */
    function coinFlip(bytes32 randomnessId) external view returns (bool) {
        require(randomnessSettled[randomnessId], "Randomness not settled");
        uint256 value = randomnessValues[randomnessId];
        return (value % 2) == 0;
    }

    /**
     * @dev Use the random value for a range (0 to max-1)
     * @param randomnessId The randomness ID
     * @param max Maximum value (exclusive)
     * @return result Random number from 0 to max-1
     */
    function randomRange(
        bytes32 randomnessId,
        uint256 max
    ) external view returns (uint256) {
        require(randomnessSettled[randomnessId], "Randomness not settled");
        require(max > 0, "Invalid max");
        uint256 value = randomnessValues[randomnessId];
        return value % max;
    }

    /**
     * @dev Receive function to accept ETH for fees
     */
    receive() external payable {}
}

