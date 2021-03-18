// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IPRIVIPodERC1155RoyaltyFactory {

  event PodCreated(string indexed uri, address podAddress);

  function getPodAddressByUri(string calldata uri)
    external
    view
    returns (address podAddress);

  /**
   *@dev caller create a new pod.
   *
   * Requirements:
   *
   * - pod should not exist before.
   */
  function createPod(string calldata uri, uint256 royaltyAmount, address creator)
    external
    returns (address podAddress);

  /**
   *@dev caller create a new pod.
   *
   * Requirements:
   *
   * - pod should not exist before.
   */
  function createMultiCreatorPod(string calldata uri, uint256 royaltyAmount, uint256[] memory royaltyShares, address[] memory creators)
    external
    returns (address podAddress);

  /**
   * @dev Moderator will mint the amount of pod token for the investor"s account
   *
   * Requirements:
   *
   * - the caller must MODERATOR_ROLE to perform this action.
   */
  function podMint(
    string calldata uri,
    address account,
    uint256 tokenId,
    uint256 amount,
    bytes calldata data
  ) external;

  /**
   * @dev Moderator will mint the amount of pod token for the investor"s account
   *
   * Requirements:
   *
   * - the caller must MODERATOR_ROLE to perform this action.
   */
  function podMintBatch(
    string calldata uri,
    address account,
    uint256[] memory tokenIds,
    uint256[] memory amounts,
    bytes calldata data
  ) external;
}
