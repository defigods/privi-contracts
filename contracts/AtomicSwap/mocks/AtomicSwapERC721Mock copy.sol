// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import "../AtomicSwapERC721.sol";

contract AtomicSwapERC721Mock is AtomicSwapERC721{
    uint256 public fakeBlockTimeStamp;

    function setBlockTimeStamp(uint256 _now) external {
        fakeBlockTimeStamp = _now;
    }

    function _getNow() internal override view returns (uint256) {
        return fakeBlockTimeStamp;
    }
}