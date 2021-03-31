// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./token/PRIVIPodERC721Token.sol";
import "./interfaces/IBridgeManager.sol";

contract PRIVIPodERC721Factory is AccessControl {
  using SafeMath for uint256;

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

  /**
   * @dev Grants `DEFAULT_ADMIN_ROLE` and `MODERATOR_ROLE` to the
   * account that deploys the contract.
   *
   */
  constructor(address bridgeAddress) {
    _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
    _setupRole(MODERATOR_ROLE, _msgSender());
    bridgeManagerAddress = bridgeAddress;
  }

  function assignRoleSwapManager(address swapManagerAddress) external {
    require(
      hasRole(MODERATOR_ROLE, _msgSender()),
      "PRIVIPodERC20Factory: must have MODERATOR_ROLE to assign SwapManager address"
    );
    _setupRole(MODERATOR_ROLE, swapManagerAddress);
  }

  function getTotalTokenCreated() external view returns (uint256 totalPods) {
    totalPods = totalPodCreated;
  }

  function getPodAddressById(string calldata podId)
    external
    view
    returns (address podAddress)
  {
    podAddress = podTokenAddressesById[podId];
  }

  function getPodAddressBySymbol(string calldata tokenSymbol)
    external
    view
    returns (address podAddress)
  {
    podAddress = podTokenAddressesBySymbol[tokenSymbol];
  }

  /**
   *@dev Create pods
   *
   * Requirements:
   *
   * - pod should not exist before.
   */
  function createPod(
    string calldata podId,
    string calldata podTokenName,
    string calldata podTokenSymbol,
    string calldata baseURI
  ) external returns (address podAddress) {
    // require(hasRole(MODERATOR_ROLE, _msgSender()), "PRIVIPodERC721TokenFactory: must have MODERATOR_ROLE to create pod.");
    require(
      podTokenAddressesById[podId] == address(0),
      "PRIVIPodERC721TokenFactory: Pod id already exists."
    );
    require(
      podTokenAddressesBySymbol[podTokenSymbol] == address(0),
      "PRIVIPodERC721TokenFactory: Pod symbol already exists."
    );
    PRIVIPodERC721Token podToken =
      new PRIVIPodERC721Token(
        podTokenName,
        podTokenSymbol,
        baseURI,
        address(this)
      );
    podAddress = address(podToken);
    totalPodCreated.add(1);
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
   * @dev Moderator will mint the amount of pod token for the investor's account
   *
   * Requirements:
   *
   * - the caller must MODERATOR_ROLE to perform this action.
   */
  function mintPodTokenById(string calldata podId, address account) external {
    require(
      hasRole(MODERATOR_ROLE, _msgSender()),
      "PRIVIPodERC721Token: must have MODERATOR_ROLE to invest for investor."
    );
    require(
      account != address(0),
      "PRIVIPodERC721Token: Account address should not be zero."
    );
    PRIVIPodERC721Token(podTokenAddressesById[podId]).mint(account);
  }

  /**
   * @dev Moderator will mint the amount of pod token for the investor's account
   *
   * Requirements:
   *
   * - the caller must MODERATOR_ROLE to perform this action.
   */
  function mintPodTokenBySymbol(string calldata tokenSymbol, address account)
    external
  {
    require(
      hasRole(MODERATOR_ROLE, _msgSender()),
      "PRIVIPodERC721Token: must have MODERATOR_ROLE to invest for investor."
    );
    require(
      account != address(0),
      "PRIVIPodERC721Token: Account address should not be zero."
    );
    PRIVIPodERC721Token(podTokenAddressesBySymbol[tokenSymbol]).mint(account);
  }
}
