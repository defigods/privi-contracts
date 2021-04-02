// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./token/PRIVIPodERC1155TokenRoyalty.sol";
import "./deployable_managers/MultiCreatorNftManager.sol";
import "./interfaces/IBridgeManager.sol";

contract PRIVIPodERC1155RoyaltyFactory is AccessControl {
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

  function assignRoleSwapManager(address swapManagerAddress) external {
    require(
      hasRole(MODERATOR_ROLE, _msgSender()),
      "PRIVIPodERC20Factory: must have MODERATOR_ROLE to assign SwapManager address"
    );
    _setupRole(MODERATOR_ROLE, swapManagerAddress);
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
   * - pod should not exist before.
   */
  function createPod(
    string calldata uri,
    uint256 royaltyAmount,
    address creator
  ) external returns (address podAddress) {
    // require(
    //   hasRole(MODERATOR_ROLE, _msgSender()),
    //   "PRIVIPodERC1155Factory: must have MODERATOR_ROLE to create pod."
    // );
    require(
      podTokenAddresses[uri] == address(0),
      "PRIVIPodERC1155Factory: Pod already exists."
    );
    PRIVIPodERC1155TokenRoyalty podToken =
      new PRIVIPodERC1155TokenRoyalty(
        uri,
        address(this),
        royaltyAmount,
        creator
      );
    podAddress = address(podToken);
    totalPodCreated += 1;
    podTokenAddresses[uri] = podAddress;
    IBridgeManager(bridgeManagerAddress).registerTokenERC1155(
      uri,
      uri,
      podAddress
    );
    emit PodCreated(uri, podAddress);
  }

  /**
   *@dev caller create a new pod.
   *
   * Requirements:
   *
   * - pod should not exist before.
   */
  function createMultiCreatorPod(
    string calldata uri,
    uint256 royaltyAmount,
    uint256[] memory royaltyShares,
    address[] memory creators
  ) external returns (address podAddress) {
    // require(
    //   hasRole(MODERATOR_ROLE, _msgSender()),
    //   "PRIVIPodERC1155Factory: must have MODERATOR_ROLE to create pod."
    // );
    require(
      podTokenAddresses[uri] == address(0),
      "PRIVIPodERC1155Factory: Pod already exists."
    );
    MultiCreatorNftManager multiCreatorManager =
      new MultiCreatorNftManager(creators, royaltyShares);
    PRIVIPodERC1155TokenRoyalty podToken =
      new PRIVIPodERC1155TokenRoyalty(
        uri,
        address(this),
        royaltyAmount,
        address(multiCreatorManager)
      );
    podAddress = address(podToken);
    totalPodCreated += 1;
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
    PRIVIPodERC1155TokenRoyalty(podTokenAddresses[uri]).mint(
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
    PRIVIPodERC1155TokenRoyalty(podTokenAddresses[uri]).mintBatch(
      account,
      tokenIds,
      amounts,
      data
    );
  }
}
