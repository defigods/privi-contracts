// SPDX-License-Identifier: MIT

pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/GSN/Context.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol";

/**
 * @dev token, including:
 *
 *  - ability for holders to burn (destroy) their tokens
 *  - a minter role that allows for token minting (creation)
 *
 * The account that deploys the contract will be granted the minter and moderator
 * roles, as well as the default admin role, which will let it grant both minter
 * and moderator roles to other accounts.
 */

contract PRIVIPodERC20TokenStakable is Context, ERC20Burnable {
    
    string constant TOKEN_NAME = 'PRIVIPodToken';
    string constant TOKEN_SYMBOL = 'PPT';

    // models
    struct midCycleInput {
        uint256 day;
        uint256 acumulatedAmount;
    }
    
    struct stakeTracker {
        uint256 lastCycleChecked;
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
    uint256 public preMatureLiquidationDate;
    uint256 public payOffPerToken;
    uint256 public currentCycleNumber;
    uint256 public lastCycleDate;
    mapping(address => bool) public isAddressActivlyStaking;
    address[] activeStakersArray;
    mapping(address => stakeTracker) public trackedStakes;
    mapping(uint256 => uint256) public interestPerCyclePerDayPerTokenMap; // cycle -> interest amount
    mapping(uint256 => uint256) public totalDaysPerCycle;
    
    event CycleInterestSet(uint256 indexed cycle, uint256 amount);
    event Invested(address indexed account, uint256 amount);
    event Staked(address indexed account, uint256 amount);
    event UnStaked(address indexed account, uint256 amount);
    event InterestClaimed(address indexed account, uint256 interest);
    
    uint256 public oneDay = 1 days;

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
        
        //_mint(msg.sender, 1000 * (10 ** 18)); // for fast test only
    }
    
    modifier onlyFactory() {
        require(_msgSender() == parentFactory, "RIVIPodToken: Only Factory can call this function.");
        _;
    }

    modifier updateStakingInterest(address account) {
        // if it is first time i.e there is no staked; this modifier passes
        // if there is staked; this modifier calculate the remaining rewards if there is any
        (uint256 rewards, , , uint256 totalMidCycleToken) = getUnPaidStakingInterest(account);
        if (rewards > 0 ) {
            trackedStakes[account].rewards = trackedStakes[account].rewards.add(rewards);
        }
        if (totalMidCycleToken > 0) {
            trackedStakes[account].fullCycleBalance = trackedStakes[account].fullCycleBalance.add(totalMidCycleToken);
        }
        trackedStakes[account].lastCycleChecked = currentCycleNumber;

        // we can have a condition for in case invetor want to invest mid-cycle
        _;
    }
    
    function removeFromActiveStakersArray(address account) internal {
        bool shouldPop = false;
        for(uint i = 0; i < activeStakersArray.length; i++) {
            if(activeStakersArray[i] == account){
                activeStakersArray[i] = activeStakersArray[activeStakersArray.length.sub(1)];
                shouldPop = true;
            }
        }
        if(shouldPop == true){
            activeStakersArray.pop();
        }
        
    }
    
    function getActiveStakersLength() public view returns(uint256 length){
        length = activeStakersArray.length;
    }
    
    function getActiveStakers() public view returns(address[] memory activeStakers) {
        activeStakers = activeStakersArray;
    }

    function getUnPaidStakingInterest(address account) public view returns(uint256 rewards, uint256 startCycle, uint256 endCycles, uint256 totalMidCycleToken) {
        
        uint256 totalReward = 0;
        uint256 midCycleTokenTotal = 0;
        // uint256 previousCycleMidInputTotalToken = 0;
        
        if (currentCycleNumber > trackedStakes[account].lastCycleChecked) {
            startCycle = trackedStakes[account].lastCycleChecked;
            endCycles = startCycle.add(currentCycleNumber.sub(trackedStakes[account].lastCycleChecked));
            for (uint256 i = startCycle; i <= endCycles; i++) {
                
                if (trackedStakes[account].fullCycleBalance > 0) { // first calculate full cycle
                totalReward = totalReward.add( 
                        (interestPerCyclePerDayPerTokenMap[i].mul(trackedStakes[account].fullCycleBalance.add(midCycleTokenTotal)))
                        .mul(totalDaysPerCycle[i]) 
                    );
                }
                
                if (trackedStakes[account].midCyclesInputsMap[i].length > 0) { // second calculate mid-cycle-inputs
                    for(uint256 j = 0; j < trackedStakes[account].midCyclesInputsMap[i].length; j++) {
                        midCycleInput memory currentInput = trackedStakes[account].midCyclesInputsMap[i][j];
                        uint256 inputDayMultiplier = totalDaysPerCycle[i].sub(currentInput.day);
                        
                        
                        totalReward = totalReward.add(
                                                        (
                                                            interestPerCyclePerDayPerTokenMap[i]
                                                            .mul(currentInput.acumulatedAmount) 
                                                        ) 
                                                        .mul(
                                                            inputDayMultiplier
                                                            )
                                                    ) 
                                                    ;
                        midCycleTokenTotal = midCycleTokenTotal.add(currentInput.acumulatedAmount);
                    }
                }
                
            }
        }

        rewards = totalReward;
        totalMidCycleToken = midCycleTokenTotal;
    }

    function stake(uint256 amount) public updateStakingInterest(_msgSender()) { // **<-|
        require(isPodActive, "PRIVIPodToken: Pod is not active anymore.");
        if (isAddressActivlyStaking[_msgSender()] == false) {
            isAddressActivlyStaking[_msgSender()] = true;
            activeStakersArray.push(_msgSender());
            
        }
        totalTokenStaked = totalTokenStaked.add(amount);
        trackedStakes[_msgSender()].lastCycleChecked = currentCycleNumber;
        //trackedStakes[_msgSender()].fullCycleBalance = trackedStakes[_msgSender()].fullCycleBalance.add(amount);
        _transfer(_msgSender(), address(this), amount);
        
        midCycleInput memory midCycle;
        midCycle.day = (now.sub(lastCycleDate)).div(oneDay);
        midCycleInput[] memory lastInputs = trackedStakes[_msgSender()].midCyclesInputsMap[currentCycleNumber];
        if (lastInputs.length > 0) {                                                                                                // there is already inputs in this cycle
           if (midCycle.day == lastInputs[(lastInputs.length).sub(1)].day ){                                                        // check if same day
                midCycle.acumulatedAmount = lastInputs[(lastInputs.length).sub(1)].acumulatedAmount.add(amount);
                trackedStakes[_msgSender()].midCyclesInputsMap[currentCycleNumber][(trackedStakes[_msgSender()].midCyclesInputsMap[currentCycleNumber].length).sub(1)] = midCycle;
            } else {                                                                                                                // another day
                midCycle.acumulatedAmount = amount;
                trackedStakes[_msgSender()].midCyclesInputsMap[currentCycleNumber].push(midCycle);
            }
        } else {                                                                                                                    // there is no input i.e it is the first time in this cycle
            midCycle.acumulatedAmount = amount;
            trackedStakes[_msgSender()].midCyclesInputsMap[currentCycleNumber].push(midCycle);
        }
        
        emit Staked(_msgSender(), amount);
    }

    function unStake(uint256 amount) public updateStakingInterest(_msgSender()) {
        totalTokenStaked = totalTokenStaked.sub(amount);
        trackedStakes[_msgSender()].fullCycleBalance = trackedStakes[_msgSender()].fullCycleBalance.sub(amount);
        
        if (trackedStakes[_msgSender()].fullCycleBalance == 0 
        && trackedStakes[_msgSender()].midCyclesInputsMap[currentCycleNumber].length == 0 
        && trackedStakes[_msgSender()].rewards == 0) { // there might be a cenario when account still have inputs or rewards
            isAddressActivlyStaking[_msgSender()] = false;
            removeFromActiveStakersArray(_msgSender());
        }

        _transfer(address(this), _msgSender(), amount);
        emit UnStaked(_msgSender(), amount);
    }
    
    function getAccountStakeTracker(address account) public view returns(
            uint256 lastCycleChecked, 
            uint256 reward, 
            uint256 fullCycleBalance, 
            midCycleInput[] memory currentCycleInputs,
            uint256 unPaidRewards, 
            uint256 startCycle, 
            uint256 endCycles, 
            uint256 totalMidCycleToken
        ) {
        stakeTracker storage accountTracker = trackedStakes[account];
        lastCycleChecked = accountTracker.lastCycleChecked;
        reward = accountTracker.rewards;
        fullCycleBalance = accountTracker.fullCycleBalance;
        currentCycleInputs = accountTracker.midCyclesInputsMap[currentCycleNumber];
        (unPaidRewards, startCycle, endCycles, totalMidCycleToken) = getUnPaidStakingInterest(account);
    }
    

    function setCycleInterest(uint256 cycle, uint256 rewardAmountPerCyclePerDayPerToken, uint256 totalCycleDays) public  onlyFactory {
        require(isPodActive, "PRIVIPodToken: Pod is not active anymore.");
        require(interestPerCyclePerDayPerTokenMap[cycle] == 0, "PRIVIPodToken: Cycle number is already set.");
        // there is point of no return , if number of cycle days sent was lower that it supposed to be
        currentCycleNumber = cycle.add(1);
        lastCycleDate = now;
        interestPerCyclePerDayPerTokenMap[cycle] = rewardAmountPerCyclePerDayPerToken;
        totalDaysPerCycle[cycle] = totalCycleDays;
        emit CycleInterestSet(cycle, rewardAmountPerCyclePerDayPerToken);
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
        emit Invested(account, amount);
    }

    function claimInterest() public updateStakingInterest(_msgSender()) {
        uint256 reward = trackedStakes[_msgSender()].rewards;
        trackedStakes[_msgSender()].rewards = 0;
        
        if (trackedStakes[_msgSender()].fullCycleBalance == 0 
        && trackedStakes[_msgSender()].midCyclesInputsMap[currentCycleNumber].length == 0 
        && trackedStakes[_msgSender()].rewards == 0) { // there might be a cenario when account still have inputs or rewards
            isAddressActivlyStaking[_msgSender()] = false;
            removeFromActiveStakersArray(_msgSender());
        }
        
        _mint(_msgSender(), reward);
        emit InterestClaimed(_msgSender(), reward);
    }
    
    // function claculateRemainingRewardsAndTokenSupply() public view returns(uint256 totalAccumulatedRewardsPlusTokenSupply) {
    //     totalAccumulatedRewardsPlusTokenSupply = totalSupply();
    //     for (uint256 i = 0; i < activeStakersArray.length; i++) {
    //         ( , uint256 reward, , , uint256 unPaidRewards, , , ) = getAccountStakeTracker(activeStakersArray[i]);
    //         uint256 AccumulatedRewards = 0;
    //         AccumulatedRewards = AccumulatedRewards.add(reward);
    //         AccumulatedRewards = AccumulatedRewards.add(unPaidRewards);
    //         totalAccumulatedRewardsPlusTokenSupply = totalAccumulatedRewardsPlusTokenSupply.add(AccumulatedRewards);
    //     }
    // }

    function liquidatePod(address fromValut, uint256 totalAmount, uint256 liquidationAmountPerToken, bool isPreMatureLiquidation) public onlyFactory {
        ERC20(investToken).transferFrom(fromValut, address(this), totalAmount);
        isPodActive = false;
        if(isPreMatureLiquidation){
            preMatureLiquidationDate = now;
        }
        payOffPerToken = liquidationAmountPerToken;
    }

    function getPayOff(uint256 amount) public {
        uint256 payOffToBeSent = amount.mul(payOffPerToken);
        require(payOffToBeSent <= ERC20(investToken).balanceOf(address(0)), "PRIVIPodToken: there is no enough balance of token for payOff");
        burnFrom(_msgSender(), amount);
        ERC20(investToken).transfer(_msgSender(), payOffToBeSent);
    }

    function _beforeTokenTransfer(address from, address to, uint256 amount) internal virtual override(ERC20) {
        super._beforeTokenTransfer(from, to, amount);
    }
}