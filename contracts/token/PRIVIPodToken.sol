// SPDX-License-Identifier: MIT

pragma solidity ^0.6.12;

import "@openzeppelin/contracts/GSN/Context.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol";

/**
 * @dev MeatToken token, including:
 *
 *  - ability for holders to burn (destroy) their tokens
 *  - a minter role that allows for token minting (creation)
 *
 * The account that deploys the contract will be granted the minter and moderator
 * roles, as well as the default admin role, which will let it grant both minter
 * and moderator roles to other accounts.
 */
contract PRIVIPodToken is Context, ERC20Burnable {
    
    string constant TOKEN_NAME = 'PRIVIPodToken';
    string constant TOKEN_SYMBOL = 'PPT';

    // models
    struct stakeTracker {
        uint256 lastCyclePaid;
        uint256 rewards;
        uint256 stakedBalance;
    }

    address public parentFactory;
    address public investToken;
    bool public isPodActive;
    uint256 public totalTokenStaked;
    uint256 public liquidationDate;
    uint256 public lastCycleNumber;
    mapping(address => stakeTracker) public trackedStakes;
    address[] public listOfStakers;
    mapping(uint256 => uint256) public interestPerCycle; // cycle -> interest amount
    
    event CycleInterestSet(uint256 indexed cycle, uint256 amount);
    event Invested(address indexed account, uint256 amount);
    event Staked(address indexed account, uint256 amount);
    event UnStaked(address indexed account, uint256 amount);
    event InterestClaimed(address indexed account, uint256 interest);

    /**
     * @dev Set parentfactory and investToken addresses.
     *
     * See {ERC20-constructor}.
     */
    constructor(address factory, address token, uint256 date) public ERC20(TOKEN_NAME, TOKEN_SYMBOL) {
        // set initial states
        parentFactory = factory;
        investToken = token;
        liquidationDate = date;
        isPodActive = true;
    }
    
    modifier onlyFactory() {
        require(_msgSender() == parentFactory, "RIVIPodToken: Only Factory can call this function.");
        _;
    }

    modifier updateStakingInterest(address account) {
        // if it is first time i.e there is no staked; this modifier passes
        // if there is staked; this modifier calculate the remaining rewards if there is any
        if (trackedStakes[account].stakedBalance > 0) {
            (uint256 rewards, , ) = getUnPaidStakingInterest();
            trackedStakes[account].rewards = trackedStakes[account].rewards.add(rewards);
            trackedStakes[account].lastCyclePaid = lastCycleNumber;
        }
        // we can have a condition for in case invetor want to invest mid-cycle
        _;
    }

    function getUnPaidStakingInterest() public view returns(uint256 rewards, uint256 startCycle, uint256 endCycles) {
        
        uint256 totalReward = 0;
        startCycle = trackedStakes[_msgSender()].lastCyclePaid.add(1);
        endCycles = startCycle.add(lastCycleNumber.sub(trackedStakes[_msgSender()].lastCyclePaid));
            for (uint256 i = startCycle; i <= endCycles; i++) {
                totalReward = totalReward.add( interestPerCycle[i].mul(trackedStakes[_msgSender()].stakedBalance) );
            }
        
        rewards = totalReward;
    }

    function setCycleInterest(uint256 cycle, uint256 rewardAmountPerCycle) public  onlyFactory {
        require(cycle == lastCycleNumber.add(1), "PRIVIPodToken: Cycle number is not the next cycle number.");
        lastCycleNumber = cycle;
        interestPerCycle[cycle] = rewardAmountPerCycle;
    }

    /**
     * @dev invest `msg.value` in Pod and get Pod token.
     *
     * See {ERC20-_mint}.
     *
     * Requirements:
     *
     * -  
     */
    function invest(address account, uint256 amount) public onlyFactory  {
        _mint(account, amount);
    }

    function stake(uint256 amount) public updateStakingInterest(_msgSender()) {
        totalTokenStaked = totalTokenStaked.add(amount);
        trackedStakes[_msgSender()].lastCyclePaid = lastCycleNumber;
        trackedStakes[_msgSender()].stakedBalance = trackedStakes[_msgSender()].stakedBalance.add(amount);
        _transfer(_msgSender(), address(this), amount);
        emit Staked(_msgSender(), amount);
    }

    function getStakedBalance() public view returns(uint256 staked) { 
        staked = trackedStakes[_msgSender()].stakedBalance;
    }

    function unStake(uint256 amount) public updateStakingInterest(_msgSender()) {
        totalTokenStaked = totalTokenStaked.sub(amount);
        trackedStakes[_msgSender()].stakedBalance = trackedStakes[_msgSender()].stakedBalance.sub(amount);
        _transfer(address(this), _msgSender(), amount);
        emit UnStaked(_msgSender(), amount);
    }

    function claimInterest() public updateStakingInterest(_msgSender()) {
        uint256 reward = trackedStakes[_msgSender()].rewards;
        trackedStakes[_msgSender()].rewards = 0;
        _mint(_msgSender(), reward);
        emit InterestClaimed(_msgSender(), reward);
    }

    function _beforeTokenTransfer(address from, address to, uint256 amount) internal virtual override(ERC20) {
        super._beforeTokenTransfer(from, to, amount);
    }
}