// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./token/PRIVIPodERC721Token.sol";
import "./interfaces/IBridgeManager.sol";

/**
 * @title   PRIVIPodERC721FactoryWhiteListed contract
 * @dev     Creates new ERC721 tokens using a factory pattern
 * @author  PRIVI
 **/
contract PRIVIPodERC721FactoryWhiteListed is AccessControl {
  bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");
  address public bridgeManagerAddress;
  uint256 private totalPodCreated;
  mapping(string => address) private podTokenAddressesById;
  mapping(string => address) private podTokenAddressesBySymbol;

  event PodCreated(
    string indexed podId,
    string podTokenName,
    string podTokenSymbol
  );


  modifier onlyAdmin() {
    require(
      hasRole(DEFAULT_ADMIN_ROLE, _msgSender()),
      "Ownable: caller is not the admin"
    );
    _;
  }

  modifier onlyModerator() {
    require(
      hasRole(MODERATOR_ROLE, _msgSender()),
      "Ownable: caller is not the moderator"
    );
    _;
  }

  /**
   * @dev
   * - Grants `DEFAULT_ADMIN_ROLE` and `MODERATOR_ROLE` to the
   *   account that deploys the contract
   * - Assigns the bridgeManager address
   */
  constructor(address bridgeAddress) {
    _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
    _setupRole(MODERATOR_ROLE, _msgSender());
    bridgeManagerAddress = bridgeAddress;
  }

  /**
   * @notice  Assigns `MODERATOR_ROLE` to SwapManager contract
   * @param   swapManagerAddress The SwapManager contract address
   */
  function assignRoleSwapManager(address swapManagerAddress) external onlyModerator {
    _setupRole(MODERATOR_ROLE, swapManagerAddress);
  }

  /**
   * @notice  Returns the total amount of Pod tokens created
   */
  function getTotalTokenCreated() external view returns (uint256 totalPods) {
    totalPods = totalPodCreated;
  }

  /**
   * @notice Returns the contract address of the Pod token
   * @param  podId The Pod token identifier
   * @return podAddress The contract address of the Pod token
   */
  function getPodAddressById(string calldata podId)
    external
    view
    returns (address podAddress)
  {
    podAddress = podTokenAddressesById[podId];
  }

  /**
   * @notice Returns the contract address of the Pod token
   * @param  tokenSymbol The Pod token symbol (ticker)
   * @return podAddress The contract address of the Pod token
   */
  function getPodAddressBySymbol(string calldata tokenSymbol)
    external
    view
    returns (address podAddress)
  {
    podAddress = podTokenAddressesBySymbol[tokenSymbol];
  }

  /**
   * @notice Creates an ERC721 Pod token and registers it in the BridgeManager
   * @dev    - Pod id must not exist
   *         - Pod name & symbol must not exist
   *         - Pod name & symbol can't be empty
   *         - Pod symbol can't be greater than 25 characters
   * @param  podId The Pod token identifier
   * @param  podTokenName The Pod token name
   * @param  podTokenSymbol The Pod token symbol (ticker)
   * @param  baseURI The base URI
   * @return podAddress The contract address of the Pod token created
   */
  function createPod(
    string calldata podId,
    string calldata podTokenName,
    string calldata podTokenSymbol,
    string calldata baseURI
  ) external onlyModerator returns (address podAddress) {
    require(
      podTokenAddressesById[podId] == address(0),
      "PRIVIPodERC721Factory: Pod id already exists"
    );
    require(
      podTokenAddressesBySymbol[podTokenSymbol] == address(0),
      "PRIVIPodERC721Factory: Pod symbol already exists"
    );

    PRIVIPodERC721Token podToken =
      new PRIVIPodERC721Token(
        podTokenName,
        podTokenSymbol,
        baseURI,
        address(this)
      );
    podAddress = address(podToken);

    totalPodCreated += 1;

    podTokenAddressesById[podId] = podAddress;
    podTokenAddressesBySymbol[podTokenSymbol] = podAddress;

    IBridgeManager(bridgeManagerAddress).registerTokenERC721(
      podTokenName,
      podTokenSymbol,
      podAddress
    );

    emit PodCreated(podId, podTokenName, podTokenSymbol);
  }

  /**
   * @notice Mints ERC721 Pod tokens
   * @dev    - The caller must be MODERATOR_ROLE
   *         - `account` address can't be zero
   * @param  podId The Pod token identifier
   * @param  account The destination account to receive minted tokens
   */
  function mintPodTokenById(string calldata podId, uint256 tokenId, address account) external onlyModerator {
    require(
      account != address(0),
      "PRIVIPodERC721Factory: Account address should not be zero"
    );
    PRIVIPodERC721Token(podTokenAddressesById[podId]).mint(account, tokenId);
  }

  /**
   * @notice Mints ERC721 Pod tokens
   * @dev    - The caller must be MODERATOR_ROLE
   *         - `account` address can't be zero
   * @param  tokenSymbol The Pod token symbol (sticker)
   * @param  account The destination account to receive minted tokens
   */
  function mintPodTokenBySymbol(string calldata tokenSymbol, uint256 tokenId, address account)
    external onlyModerator
  {
    require(
      account != address(0),
      "PRIVIPodERC721Factory: Account address should not be zero"
    );
    PRIVIPodERC721Token(podTokenAddressesBySymbol[tokenSymbol]).mint(account, tokenId);
  }

  function addModerator(address _account) public onlyAdmin {
    grantRole(MODERATOR_ROLE, _account);
  }

  function removeModerator(address _account) public onlyAdmin {
    revokeRole(MODERATOR_ROLE, _account);
  }
}
