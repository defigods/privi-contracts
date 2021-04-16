// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import "../AtomicSwapERC1155.sol";

contract AtomicSwapERC1155Mock is AtomicSwapERC1155{
    uint256 public fakeBlockTimeStamp;

    function setBlockTimeStamp(uint256 _now) external {
        fakeBlockTimeStamp = _now;
    }

    function _getNow() internal override view returns (uint256) {
        return fakeBlockTimeStamp;
    }
}