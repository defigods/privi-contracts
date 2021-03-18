// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./token/PRIVIPodERC1155Token.sol";
import "./interfaces/IBridgeManager.sol";

contract PRIVIPodERC1155Factory is AccessControl {
  using SafeMath for uint256;

  bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");
  address public bridgeManagerAddress;
  uint256 public totalPodCreated;
  mapping(string => address) public podTokenAddresses;

  event PodCreated(string indexed uri, address podAddress);

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

  function getPodAddressByUri(string calldata uri)
    external
    view
    returns (address podAddress)
  {
    podAddress = podTokenAddresses[uri];
  }

  /**
   *@dev caller create a new pod.
   *
   * Requirements:
   *
   * - the caller must MODERATOR_ROLE to perform this action.
   * - pod should not exist before.
   */
  function createPod(string calldata uri)
    external
    returns (address podAddress)
  {
    require(
      hasRole(MODERATOR_ROLE, _msgSender()),
      "PRIVIPodERC1155Factory: must have MODERATOR_ROLE to create pod."
    );
    require(
      podTokenAddresses[uri] == address(0),
      "PRIVIPodERC1155Factory: Pod already exists."
    );
    PRIVIPodERC1155Token podToken =
      new PRIVIPodERC1155Token(uri, address(this));
    podAddress = address(podToken);
    totalPodCreated.add(1);
    podTokenAddresses[uri] = podAddress;
    IBridgeManager(bridgeManagerAddress).registerTokenERC1155(
      uri,
      uri,
      podAddress
    );
    emit PodCreated(uri, podAddress);
  }

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
  ) external {
    require(
      hasRole(MODERATOR_ROLE, _msgSender()),
      "PRIVIPodERC1155Factory: must have MODERATOR_ROLE to invest for investor."
    );
    require(
      account != address(0),
      "PRIVIPodERC1155Factory: Account address should not be zero."
    );
    require(amount > 0, "PRIVIPodERC1155Factory: amount should not be zero.");
    PRIVIPodERC1155Token(podTokenAddresses[uri]).mint(
      account,
      tokenId,
      amount,
      data
    );
  }

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
  ) external {
    require(
      hasRole(MODERATOR_ROLE, _msgSender()),
      "PRIVIPodERC1155Factory: must have MODERATOR_ROLE to invest for investor."
    );
    require(
      account != address(0),
      "PRIVIPodERC1155Factory: Account address should not be zero."
    );
    PRIVIPodERC1155Token(podTokenAddresses[uri]).mintBatch(
      account,
      tokenIds,
      amounts,
      data
    );
  }
}
