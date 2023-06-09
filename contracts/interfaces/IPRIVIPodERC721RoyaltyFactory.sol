// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IPRIVIPodERC721RoyaltyFactory {

  event PodCreated(
    string indexed podId,
    string podTokenName,
    string podTokenSymbol
  );

  /**
   * @notice  Assigns `MODERATOR_ROLE` to SwapManager contract
   * @param   swapManagerAddress The SwapManager contract address
   */
  function assignRoleSwapManager(address swapManagerAddress) external;

  /**
   * @notice  Returns the total amount of Pod tokens created
   */
  function getTotalTokenCreated() external view returns (uint256 totalPods);

  /**
   * @notice Returns the contract address of the Pod token
   * @param  podId The Pod token identifier
   * @return podAddress The contract address of the Pod token
   */
  function getPodAddressById(string calldata podId)
    external
    view
    returns (address podAddress);

  /**
   * @notice Returns the contract address of the Pod token
   * @param  tokenSymbol The Pod token symbol (ticker)
   * @return podAddress The contract address of the Pod token
   */
  function getPodAddressBySymbol(string calldata tokenSymbol)
    external
    view
    returns (address podAddress);

  /**
   * @notice Creates a royalty ERC721 Pod token and registers it in the BridgeManager
   * @dev    - Pod id must not exist
   *         - Pod name & symbol must not exist
   *         - Pod name & symbol can't be empty
   *         - Pod symbol can't be greater than 25 characters
   * @param  podId The Pod token identifier
   * @param  podTokenName The Pod token name
   * @param  podTokenSymbol The Pod token symbol (ticker)
   * @param  baseURI The base URI
   * @param  royaltyAmount The royalty amount in percentage
   * @param  creator The Pod token creator to receive royalties
   * @return podAddress The contract address of the Pod token created
   */
  function createPod(
    string calldata podId,
    string calldata podTokenName,
    string calldata podTokenSymbol,
    string calldata baseURI,
    uint256 royaltyAmount,
    address creator
  ) external returns (address podAddress);

  /**
   * @notice Creates a royalty ERC721 Pod tokens generated by multiple 
   * creators and registers it in the BridgeManager
   * @dev    - Pod id must not exist
   *         - Pod name & symbol must not exist
   *         - Pod name & symbol can't be empty
   *         - Pod symbol can't be greater than 25 characters
   * @param  podId The Pod token identifier
   * @param  podTokenName The Pod token name
   * @param  podTokenSymbol The Pod token symbol (ticker)
   * @param  baseURI The base URI
   * @param  royaltyAmount The royalty amount in percentage
   * @param  royaltyShares An array of royalty amounts to be shared to creators
   * @param  creators An array of Pod token creators to receive royalties
   * @return podAddress The contract address of the Pod token created
   */
  function createMultiCreatorPod(
    string calldata podId,
    string calldata podTokenName,
    string calldata podTokenSymbol,
    string calldata baseURI,
    uint256 royaltyAmount,
    uint256[] memory royaltyShares,
    address[] memory creators
  ) external returns (address podAddress);

  /**
   * @notice Mints royalty ERC721 Pod tokens
   * @dev    - The caller must be MODERATOR_ROLE
   *         - `account` address can't be zero
   * @param  podId The Pod token identifier
   * @param  account The destination account to receive minted tokens
   */
  function mintPodTokenById(string calldata podId, uint256 tokenId, address account) external;

  /**
   * @notice Mints royalty ERC721 Pod tokens
   * @dev    - The caller must be MODERATOR_ROLE
   *         - `account` address can't be zero
   * @param  tokenSymbol The Pod token symbol (sticker)
   * @param  account The destination account to receive minted tokens
   */
  function mintPodTokenBySymbol(string calldata tokenSymbol, uint256 tokenId, address account)
    external;
}
