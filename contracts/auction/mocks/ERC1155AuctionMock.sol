// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import "../ERC1155Auction.sol";

/**
 * @notice Mock Contract of ERC1155Auction
 */
contract ERC1155AuctionMock is ERC1155Auction {
    uint256 public fakeBlockTimeStamp = 100;

    /**
     * @notice Auction Constructor
     * @param _token Token Interface
     * @param _serviceFeeRecipient service fee recipient address
     */
    constructor(
        IERC1155 _token,
        address _serviceFeeRecipient
    ) ERC1155Auction(_token, _serviceFeeRecipient) {}

    function setBlockTimeStamp(uint256 _now) external {
        fakeBlockTimeStamp = _now;
    }

    function _getNow() internal override view returns (uint256) {
        return fakeBlockTimeStamp;
    }
}