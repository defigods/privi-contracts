// SPDX-License-Identifier: MIT

pragma solidity ^0.6.12;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "./token/PRIVIPodERC20TokenStakable.sol";

contract PRIVIPodERC20Factory_Stakeable is AccessControl {
    using SafeMath for uint256;
    
    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");
    
    uint256 public totalPodCreated;
    mapping (string => address) public podTokenAddresses;

    event PodCreated(string indexed podId, address podAddress, uint256 endDate);
    
    
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
    function createPod(string calldata podId, address investToken, uint256 endDate) public returns (address podAddress){
        require(hasRole(MODERATOR_ROLE, _msgSender()), "PRIVIFactory: must have MODERATOR_ROLE to create pod.");
        require(podTokenAddresses[podId] == address(0), "PRIVIFactory: Pod already exists.");
        PRIVIPodERC20Token podToken = new PRIVIPodERC20Token(address(this), investToken , endDate);
        podAddress = address(podToken);
        totalPodCreated.add(1);
        podTokenAddresses[podId] = podAddress;
        emit PodCreated(podId, podAddress, endDate);
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
        PRIVIPodERC20Token(podTokenAddresses[podId]).invest(account, investAmount);
    }
    
    /**
     * @dev Moderator will set the pod cycle's interest amount
     *
     * Requirements:
     *
     * - the caller must MODERATOR_ROLE to perform this action.
     */
    function setPodCycleInterest(string calldata podId, uint256 cycle, uint256 rewardAmountPerCyclePerDayPerToken, uint256 podCycleLengthInDays) public {
        require(hasRole(MODERATOR_ROLE, _msgSender()), "PRIVIFactory: must have MODERATOR_ROLE to set cycle interest.");
        // require(cycle > 0, "PRIVIFactory: Cycle should not be zero.");
        require(rewardAmountPerCyclePerDayPerToken > 0, "PRIVIFactory: rewardAmountPerCyclePerDayPerToken should not be zero.");
        PRIVIPodERC20Token(podTokenAddresses[podId]).setCycleInterest(cycle, rewardAmountPerCyclePerDayPerToken, podCycleLengthInDays);
    }

    function liquidatePod(string calldata podId, address fromValut, uint256 totalAmount, uint256 liquidationAmountPerToken, bool isPreMatureLiquidation) public {
        require(hasRole(MODERATOR_ROLE, _msgSender()), "PRIVIFactory: must have MODERATOR_ROLE to set pod liquidation.");
        PRIVIPodERC20Token(podTokenAddresses[podId]).liquidatePod(fromValut, totalAmount, liquidationAmountPerToken, isPreMatureLiquidation);
    }
    
}