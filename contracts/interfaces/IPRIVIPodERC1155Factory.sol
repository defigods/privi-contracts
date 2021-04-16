// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IPRIVIPodERC1155Factory {

  event PodCreated(string indexed uri, address podAddress);

  //TODO: getTotalTokenCreated()

  /**
   * @notice  Assigns `MODERATOR_ROLE` to SwapManager contract
   * @param   swapManagerAddress The SwapManager contract address
   */
  function assignRoleSwapManager(address swapManagerAddress) external;

  /**
   * @notice Returns the contract address of the Pod token
   * @param  uri The Pod URI
   * @return podAddress The contract address of the Pod token
   */
  function getPodAddressByUri(string calldata uri)
    external
    view
    returns (address podAddress);

  /**
   * @notice Returns the contract address of the Pod token
   * @param  podId The Pod Id
   * @return podAddress The contract address of the Pod token
   */
  function getPodAddressById(string calldata podId)
    external
    view
    returns (address podAddress);

  /**
   * @notice Creates an ERC1155 Pod token and registers it in the BridgeManager
   * @dev    - Pod id must not exist
   * @param  uri The base URI
   */
  function createPod(string calldata uri, string calldata podId)
    external
    returns (address podAddress);

  /**
   * @notice Mints ERC721 Pod tokens
   * @dev    - The caller must be MODERATOR_ROLE
   *         - `account` address can't be zero
   * @param  uri The base URI
   * @param  account The destination account to receive minted tokens
   * @param  tokenId The Pod token identifier
   * @param  amount The amount of tokens to be minted
   * @param  data The data to be added (currently not used)
   */
  function mintPodTokenByUri(
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
  function mintPodTokenById(
    string calldata podId,
    address account,
    uint256 tokenId,
    uint256 amount,
    bytes memory data
  ) external;

  /**
   * @dev Moderator will mint the amount of pod token for the investor"s account
   *
   * Requirements:
   *
   * - the caller must MODERATOR_ROLE to perform this action.
   */
  function batchMintPodTokenByUri(
    string calldata uri,
    address account,
    uint256[] memory tokenIds,
    uint256[] memory amounts,
    bytes calldata data
  ) external;

  /**
   * @dev Moderator will mint the amount of pod token for the investor"s account
   *
   * Requirements:
   *
   * - the caller must MODERATOR_ROLE to perform this action.
   */
  function batchMintPodTokenById(
    string calldata podId,
    address account,
    uint256[] memory tokenIds,
    uint256[] memory amounts,
    bytes calldata data
  ) external;
}
