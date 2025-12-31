// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ISwitchboard {
    struct Randomness {
        bytes32 randId;
        uint256 createdAt;
        address authority;
        uint256 rollTimestamp;
        uint64 minSettlementDelay;
        address oracle;
        uint256 value;
        uint256 settledAt;
    }

    function createRandomness(
        bytes32 randomnessId,
        uint64 minSettlementDelay
    ) external returns (address oracle);

    function getRandomness(
        bytes32 randomnessId
    ) external view returns (Randomness memory);

    function isRandomnessReady(bytes32 randomnessId) external view returns (bool ready);

    function settleRandomness(bytes calldata encodedRandomness) external payable;

    function updateFee() external view returns (uint256);
}

