// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./token/PRIVIPodERC20Token.sol";
import "./interfaces/IBridgeManager.sol";

contract PRIVIPodERC20Factory is AccessControl {

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
    string calldata podTokenSymbol
  ) external returns (address podAddress) {
    // require(hasRole(MODERATOR_ROLE, _msgSender()), "PRIVIPodERC20Factory: must have MODERATOR_ROLE to create pod.");
    // TODO: is it Users or Admins to create them? what restrictions shall we applied to call this function?
    require(
      podTokenAddressesById[podId] == address(0),
      "PRIVIPodERC20Factory: Pod id already exists"
    );
    require(
      podTokenAddressesBySymbol[podTokenSymbol] == address(0),
      "PRIVIPodERC20Factory: Pod symbol already exists"
    );
    PRIVIPodERC20Token podToken =
      new PRIVIPodERC20Token(podTokenName, podTokenSymbol, address(this));
    podAddress = address(podToken);
    totalPodCreated += 1;
    podTokenAddressesById[podId] = podAddress;
    podTokenAddressesBySymbol[podTokenSymbol] = podAddress;
    IBridgeManager(bridgeManagerAddress).registerTokenERC20(
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
  function mintPodTokenById(
    string calldata podId,
    address account,
    uint256 investAmount
  ) external {
    require(
      hasRole(MODERATOR_ROLE, _msgSender()),
      "PRIVIPodERC20Factory: must have MODERATOR_ROLE to invest for investor"
    );
    require(
      account != address(0),
      "PRIVIPodERC20Factory: Account address should not be zero"
    );
    require(
      investAmount > 0,
      "PRIVIPodERC20Factory: investAmount should not be zero"
    );
    PRIVIPodERC20Token(podTokenAddressesById[podId]).mint(
      account,
      investAmount
    );
  }

  /**
   * @dev Moderator will mint the amount of pod token for the investor's account
   *
   * Requirements:
   *
   * - the caller must MODERATOR_ROLE to perform this action.
   */
  function mintPodTokenBySymbol(
    string calldata tokenSymbol,
    address account,
    uint256 investAmount
  ) external {
    require(
      hasRole(MODERATOR_ROLE, _msgSender()),
      "PRIVIPodERC20Factory: must have MODERATOR_ROLE to invest for investor"
    );
    require(
      account != address(0),
      "PRIVIPodERC20Factory: Account address should not be zero"
    );
    require(
      investAmount > 0,
      "PRIVIPodERC20Factory: investAmount should not be zero"
    );
    PRIVIPodERC20Token(podTokenAddressesBySymbol[tokenSymbol]).mint(
      account,
      investAmount
    );
  }
}
