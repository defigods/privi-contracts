pragma solidity 0.7.6;

// SPDX-License-Identifier: MIT

abstract contract NFTRoyalty {
  /*
   * bytes4(keccak256('supportsInterface(bytes4)')) == 0x01ffc9a7
   */
  uint256 internal royalty_amount;
  address internal creator;

  /**
    @notice (Mandatory) This event is emitted when royalties are transfered.

    @dev The marketplace would emit this event from their contracts. Or they would call royaltiesRecieved() function.

    @param creator The original creator of the NFT entitled to the royalties
    @param buyer The person buying the NFT on a secondary sale
    @param amount The amount being paid to the creator
    */
  event RecievedRoyalties(
    address indexed creator,
    address indexed buyer,
    uint256 indexed amount
  );

  constructor(uint256 _amount, address _creator) {
    royalty_amount = _amount;
    creator = _creator;
  }

  /**
    @notice (Mandatory) This Function retrieve royalty info.
    */
  function royaltyInfo() external view returns (uint256, address) {
    return (royalty_amount, creator);
  }

  /**
    @notice (optional) check if NFT has royalty
    */
  function hasRoyalties() public pure returns (bool) {
    return true;
  }

  /**
    @notice (optional) get royalty creator address
    */
  function royaltyCreator() external view returns (address) {
    return creator;
  }

  /**
    @notice (optional) get royalty amount
    */
  function royaltyAmount() external view returns (uint256) {
    return royalty_amount;
  }

  /**
    @notice (optional) check if NFT has royalty
    */
  function royaltiesRecieved(
    address _creator,
    address _buyer,
    uint256 _amount
  ) public {
    emit RecievedRoyalties(_creator, _buyer, _amount);
  }
}
