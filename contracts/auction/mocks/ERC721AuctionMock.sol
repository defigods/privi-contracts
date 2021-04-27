// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

import "../ERC721Auction.sol";

/**
 * @notice Mock Contract of ERC721Auction
 */
contract ERC721AuctionMock is ERC721Auction {
    uint256 public fakeBlockTimeStamp = 100;

    /**
     * @notice Auction Constructor
     * @param _token Token Interface
     * @param _serviceFeeRecipient service fee recipient address
     */
    constructor(
        IERC721 _token,
        address _serviceFeeRecipient
    ) ERC721Auction(_token, _serviceFeeRecipient) {}

    function setBlockTimeStamp(uint256 _now) external {
        fakeBlockTimeStamp = _now;
    }

    function _getNow() internal override view returns (uint256) {
        return fakeBlockTimeStamp;
    }
}