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
    struct midCycleInput {
        uint256 day;
        uint256 acumulatedAmount;
    }
    
    struct stakeTracker {
        uint256 lastCyclePaid;
        uint256 rewards;
        uint256 fullCycleBalance;
        // midCycleInput[] midCycleInputs;
        mapping(uint256 => midCycleInput[]) midCyclesInputsMap; // inputs per cycle : cycle => input array
    }

    address public parentFactory;
    address public investToken;
    bool public isPodActive;
    uint256 public totalTokenStaked;
    uint256 public liquidationDate;
    uint256 public lastCycleNumber;
    uint256 public lastCycleDate;
    mapping(address => stakeTracker) public trackedStakes;
    mapping(uint256 => uint256) public interestPerCycle; // cycle -> interest amount
    mapping(uint256 => uint256) public totalDaysPerCycle;
    
    event CycleInterestSet(uint256 indexed cycle, uint256 amount);
    event Invested(address indexed account, uint256 amount);
    event Staked(address indexed account, uint256 amount);
    event UnStaked(address indexed account, uint256 amount);
    event InterestClaimed(address indexed account, uint256 interest);
    
    uint256 public oneDay = 10;

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
        lastCycleDate = now;
        
        _mint(msg.sender, 1000);
    }
    
    modifier onlyFactory() {
        require(_msgSender() == parentFactory, "RIVIPodToken: Only Factory can call this function.");
        _;
    }

    modifier updateStakingInterest(address account) {
        // if it is first time i.e there is no staked; this modifier passes
        // if there is staked; this modifier calculate the remaining rewards if there is any
        
        (uint256 rewards, , ) = getUnPaidStakingInterest(account);
        if (rewards > 0 ) {
            trackedStakes[account].rewards = trackedStakes[account].rewards.add(rewards);
            trackedStakes[account].lastCyclePaid = lastCycleNumber;
        }

        // we can have a condition for in case invetor want to invest mid-cycle
        _;
    }
    
    function cycleDays(uint256 cycle) public view returns(uint256 cycle_Days) {
        cycle_Days = totalDaysPerCycle[cycle];
    }

    function getUnPaidStakingInterest(address account) public view returns(uint256 rewards, uint256 startCycle, uint256 endCycles) {
        
        uint256 totalReward = 0;
        
        if (lastCycleNumber > trackedStakes[account].lastCyclePaid) {
            startCycle = trackedStakes[account].lastCyclePaid.add(1);
            endCycles = startCycle.add(lastCycleNumber.sub(trackedStakes[account].lastCyclePaid));
            for (uint256 i = startCycle; i <= endCycles; i++) {
                
                if (trackedStakes[account].fullCycleBalance > 0) { // first calculate full cycle
                totalReward = totalReward.add( 
                        (interestPerCycle[i].mul(trackedStakes[account].fullCycleBalance))
                        .mul(totalDaysPerCycle[i]) 
                    );
                }
                /*
                if (trackedStakes[account].midCycleInputs.length > 0) { // second calculate mid-cycle-inputs
                    for(uint256 j = 0; j < trackedStakes[account].midCycleInputs.length; j++) {
                        midCycleInput memory currentInput = trackedStakes[account].midCycleInputs[j];
                        uint256 inputDayMultiplier = totalDaysPerCycle[i].sub(currentInput.day);
                        totalReward = totalReward.add(
                            (interestPerCycle[i].mul(currentInput.acumulatedAmount))
                            .mul(inputDayMultiplier) 
                        );
                    }
                }
                */
            }
        }

        rewards = totalReward;
    }

    function stake(uint256 amount) public updateStakingInterest(_msgSender()) { // **<-|
        totalTokenStaked = totalTokenStaked.add(amount);
        trackedStakes[_msgSender()].lastCyclePaid = lastCycleNumber;
        //trackedStakes[_msgSender()].fullCycleBalance = trackedStakes[_msgSender()].fullCycleBalance.add(amount);
        _transfer(_msgSender(), address(this), amount);
        
        midCycleInput memory midCycle;
        midCycle.day = (now.sub(lastCycleDate)).div(oneDay);
        midCycleInput[] memory lastInputs = trackedStakes[_msgSender()].midCyclesInputsMap[lastCycleNumber];
        if (lastInputs.length > 0) {                                                                                                // there is already inputs in this cycle
           if (midCycle.day == lastInputs[(lastInputs.length).sub(1)].day ){                                                        // check if same day
                midCycle.acumulatedAmount = lastInputs[(lastInputs.length).sub(1)].acumulatedAmount.add(amount);
                trackedStakes[_msgSender()].midCyclesInputsMap[lastCycleNumber][(trackedStakes[_msgSender()].midCyclesInputsMap[lastCycleNumber].length).sub(1)] = midCycle;
            } else {                                                                                                                // another day
                midCycle.acumulatedAmount = amount;
                trackedStakes[_msgSender()].midCyclesInputsMap[lastCycleNumber].push(midCycle);
            }
        } else {                                                                                                                    // there is no input i.e it is the first time in this cycle
            midCycle.acumulatedAmount = amount;
            trackedStakes[_msgSender()].midCyclesInputsMap[lastCycleNumber].push(midCycle);
        }
        
        emit Staked(_msgSender(), amount);
    }

    function getStakedBalance() public view returns(uint256 staked) { 
        staked = trackedStakes[_msgSender()].fullCycleBalance;
    }

    function unStake(uint256 amount) public updateStakingInterest(_msgSender()) {
        totalTokenStaked = totalTokenStaked.sub(amount);
        trackedStakes[_msgSender()].fullCycleBalance = trackedStakes[_msgSender()].fullCycleBalance.sub(amount);
        _transfer(address(this), _msgSender(), amount);
        emit UnStaked(_msgSender(), amount);
    }
    
    function getAccountStakeTracker(address account) public view returns(uint256 lastCyclePaid, uint256 reward, uint256 fullCycleBalance, midCycleInput[] memory lasyCycleInputs) {
        stakeTracker storage accountTracker = trackedStakes[account];
        lastCyclePaid = accountTracker.lastCyclePaid;
        reward = accountTracker.rewards;
        fullCycleBalance = accountTracker.fullCycleBalance;
        lasyCycleInputs = accountTracker.midCyclesInputsMap[lastCycleNumber];
    }
    

    function setCycleInterest(uint256 cycle, uint256 rewardAmountPerCyclePerDay, uint256 totalCycleDays) public  onlyFactory {
        require(cycle == lastCycleNumber.add(1), "PRIVIPodToken: Cycle number is not the next cycle number.");
        lastCycleNumber = cycle;
        lastCycleDate = now;
        interestPerCycle[cycle] = rewardAmountPerCyclePerDay;
        totalDaysPerCycle[cycle] = totalCycleDays;
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