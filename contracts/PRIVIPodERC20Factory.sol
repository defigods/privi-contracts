// SPDX-License-Identifier: MIT

pragma solidity ^0.6.12;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "./token/PRIVIPodERC20Token.sol";

contract PRIVIPodERC20Factory is AccessControl {
    using SafeMath for uint256;
    
    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");
    
    uint256 public totalPodCreated;
    mapping (string => address) public podTokenAddresses;

    event PodCreated(string indexed podId, string podTokenName, string podTokenSymbol);
    
    /**
     * @dev Grants `DEFAULT_ADMIN_ROLE` and `MODERATOR_ROLE` to the
     * account that deploys the contract.
     *
     */
    constructor() public {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setupRole(MODERATOR_ROLE, _msgSender());
    }
    
    /**
     *@dev not clear who can create a pod
     *
     * Requirements:
     *
     * - pod should not exist before.
     */
    function createPod(string calldata podId, string calldata podTokenName, string calldata podTokenSymbol) public returns (address podAddress){
        require(hasRole(MODERATOR_ROLE, _msgSender()), "PRIVIFactory: must have MODERATOR_ROLE to create pod.");
        require(podTokenAddresses[podId] == address(0), "PRIVIFactory: Pod already exists.");
        PRIVIPodERC20Token podToken = new PRIVIPodERC20Token(podTokenName, podTokenSymbol , address(this));
        podAddress = address(podToken);
        totalPodCreated.add(1);
        podTokenAddresses[podId] = podAddress;
        emit PodCreated(podId, podTokenName, podTokenSymbol);
    }
    
    /**
     * @dev Moderator will invest the amount of pod token for the investor
     *
     * Requirements:
     *
     * - the caller must MODERATOR_ROLE to perform this action.
     */
    function callPodInvest(string calldata podId, address account,  uint256 investAmount) public {
        require(hasRole(MODERATOR_ROLE, _msgSender()), "PRIVIFactory: must have MODERATOR_ROLE to invest for investor.");
        require(account != address(0), "PRIVIFactory: Account address should not be zero.");
        require(investAmount > 0, "PRIVIFactory: investAmount should not be zero.");
        PRIVIPodERC20Token(podTokenAddresses[podId]).mint(account, investAmount);
    }
    
}