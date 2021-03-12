// SPDX-License-Identifier: MIT

pragma solidity ^0.7.6;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "./token/PRIVIPodERC1155Token.sol";

contract PRIVIPodERC1155Factory is AccessControl {
    using SafeMath for uint256;
    
    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");
    
    uint256 public totalPodCreated;
    mapping (string => address) public podTokenAddresses;

    event PodCreated(string indexed uri, address podAddress);
    
    /**
     * @dev Grants `DEFAULT_ADMIN_ROLE` and `MODERATOR_ROLE` to the
     * account that deploys the contract.
     *
     */
    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setupRole(MODERATOR_ROLE, _msgSender());
    }
    
    /**
     *@dev caller create a new pod.
     *
     * Requirements:
     *
     * - the caller must MODERATOR_ROLE to perform this action.
     * - pod should not exist before.
     */
    function createPod(string calldata uri) public returns (address podAddress){
        require(hasRole(MODERATOR_ROLE, _msgSender()), "PRIVIPodERC1155Factory: must have MODERATOR_ROLE to create pod.");
        require(podTokenAddresses[uri] == address(0), "PRIVIPodERC1155Factory: Pod already exists.");
        PRIVIPodERC1155Token podToken = new PRIVIPodERC1155Token(uri, address(this));
        podAddress = address(podToken);
        totalPodCreated.add(1);
        podTokenAddresses[uri] = podAddress;
        emit PodCreated(uri, podAddress);
    }
    
    /**
     * @dev Moderator will mint the amount of pod token for the investor's account
     *
     * Requirements:
     *
     * - the caller must MODERATOR_ROLE to perform this action.
     */
    function podMint(string calldata uri, address account, uint256 tokenId,  uint256 amount, bytes calldata data) public {
        require(hasRole(MODERATOR_ROLE, _msgSender()), "PRIVIPodERC1155Factory: must have MODERATOR_ROLE to invest for investor.");
        require(account != address(0), "PRIVIPodERC1155Factory: Account address should not be zero.");
        require(amount > 0, "PRIVIPodERC1155Factory: amount should not be zero.");
        PRIVIPodERC1155Token(podTokenAddresses[uri]).mint(account, tokenId, amount, data);
    }

    function podMintBatch(string calldata uri, address account, uint256[] memory  tokenIds,  uint256[] memory  amounts, bytes calldata data) public {
        require(hasRole(MODERATOR_ROLE, _msgSender()), "PRIVIPodERC1155Factory: must have MODERATOR_ROLE to invest for investor.");
        require(account != address(0), "PRIVIPodERC1155Factory: Account address should not be zero.");
        PRIVIPodERC1155Token(podTokenAddresses[uri]).mintBatch(account, tokenIds, amounts, data);
    }
    
}