// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IPRIVIPodERC20Factory {
  function getTotalTokenCreated() external view returns (uint256 totalPods);

  function getPodAddressById(string calldata podId)
    external
    view
    returns (address podAddress);

  function getPodAddressBySymbol(string calldata tokenSymbol)
    external
    view
    returns (address podAddress);

  /**
   *@dev only MODERATOR_ROLE role can create pods
   *
   * Requirements:
   *
   * - pod should not exist before.
   */
  function createPod(
    string calldata podId,
    string calldata podTokenName,
    string calldata podTokenSymbol
  ) external returns (address podAddress);

  /**
   * @dev Moderator will mint the amount of pod token for the investor's account
   *
   * Requirements:
   *
   * - the caller must MODERATOR_ROLE to perform this action.
   */
  function mintPodTokenById(
    string calldata podId,
    address account,
    uint256 investAmount
  ) external;

  function mintPodTokenBySymbol(
    string calldata tokenSymbol,
    address account,
    uint256 investAmount
  ) external;
}
