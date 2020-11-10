// SPDX-License-Identifier: MIT

pragma solidity ^0.6.12;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./token/PRIVIPodToken.sol";

contract PRIVIFactory is AccessControl {
    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");
    
    mapping (string => address) public podTokenAddresses;
    
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
    function createPodToken(string calldata podId, address investToken, uint256 endDate) public returns (address podAddress){
        // require(hasRole(MODERATOR_ROLE, _msgSender()), "PRIVIFactory: must have MODERATOR_ROLE to invest for investor");
        require(podTokenAddresses[podId] == address(0), "PRIVIFactory: Pod already exists.");
        PRIVIPodToken podToken = new PRIVIPodToken(address(this), investToken , endDate);
        podAddress = address(podToken);
        podTokenAddresses[podId] = podAddress;
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
        PRIVIPodToken(podTokenAddresses[podId]).invest(account, investAmount);
    }
    
    /**
     * @dev Moderator will set the pod cycle's interest amount
     *
     * Requirements:
     *
     * - the caller must MODERATOR_ROLE to perform this action.
     */
    function setPodCycleInterest(string calldata podId, uint256 cycle, uint256 interestAmount) public {
        require(hasRole(MODERATOR_ROLE, _msgSender()), "PRIVIFactory: must have MODERATOR_ROLE to set cycle interest.");
        require(cycle > 0, "PRIVIFactory: Cycle should not be zero.");
        require(interestAmount > 0, "PRIVIFactory: interestAmount should not be zero.");
        PRIVIPodToken(podTokenAddresses[podId]).setCycleInterest(cycle, interestAmount);
    }
    
}