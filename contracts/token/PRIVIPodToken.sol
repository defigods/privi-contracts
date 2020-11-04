// SPDX-License-Identifier: MIT

pragma solidity ^0.6.12;

import "@openzeppelin/contracts/access/AccessControl.sol";
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
contract PRIVIPodToken is Context, ERC20Burnable, AccessControl {    
    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");
    string constant TOKEN_NAME = 'PRIVIPodToken';
    string constant TOKEN_SYMBOL = 'PPT';

    // models
    struct stakeTracker {
        uint256 lastCyclePaid;
        uint256 rewards;
        uint256 tokenStaked;
    }

    address public parentFactory;
    address public investToken;
    bool public isPodActive;
    uint256 public totalTokenStaked;
    mapping(address => stakeTracker) public stakedBalances;
    mapping(uint256 => uint256) public interestPerCycle; // cycle -> interest amount
    mapping(address => mapping(uint256 => bool)) public accountCyclePaid; // address -> (cycle => claimed)

    /**
     * @dev Set parentfactory and investToken addresses.
     *
     * See {ERC20-constructor}.
     */
    constructor(address factory, address token) public ERC20(TOKEN_NAME, TOKEN_SYMBOL) {
        // setting initial roles
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setupRole(MODERATOR_ROLE, _msgSender());
        // set initial states
        parentFactory = factory;
        investToken = token;
    }

    modifier updateStakingInterest(address account, uint256 cycleNumber) {
        require(accountCyclePaid[account][cycleNumber] == false, "PRIVIPodToken: Interest for the current cycle is already paid.");
        require(interestPerCycle[cycleNumber] > 0 , "PRIVIPodToken: Interest is not set for this cycle yet.");
        
        if (cycleNumber > stakedBalances[account].lastCyclePaid) {
                        
            if (stakedBalances[account].tokenStaked > 0) {
                stakedBalances[account].rewards = interestPerCycle[cycleNumber].mul(stakedBalances[account].tokenStaked);
            }
            accountCyclePaid[account][cycleNumber] = true;       
            stakedBalances[account].lastCyclePaid = cycleNumber;
            
            //emit CycleRewardPaid(account, stakedBalances[account].rewards);                                                     
        }
        _;
    }

    function setCycleInterest(uint256 cycle, uint256 amount) public {
        require(hasRole(MODERATOR_ROLE, _msgSender()), "PRIVIPodToken: must have MODERATOR_ROLE.");
        interestPerCycle[cycle] = amount;
    }

    /**
     * @dev invest `msg.value` in Pod and get Pod token.
     *
     * See {ERC20-_mint}.
     *
     * Requirements:
     *
     * - call must have approved the amount 
     */
    function invest(uint256 amount) public {
        ERC20(investToken).transferFrom(_msgSender(), address(this), amount); 
        _mint(_msgSender(), amount);
    }

    function stake(uint256 amount) public {
        totalTokenStaked = totalTokenStaked.add(amount);
        stakedBalances[_msgSender()].tokenStaked = stakedBalances[_msgSender()].tokenStaked.add(amount);
        _transfer(_msgSender(), address(this), amount);
        //emit Staked(_msgSender(), amount, _totalTokenStaked);
    }

    function unStake(uint256 amount, uint256 cycleNumber) public updateStakingInterest(_msgSender(), cycleNumber) {
        totalTokenStaked = totalTokenStaked.sub(amount);
        stakedBalances[_msgSender()].tokenStaked = stakedBalances[_msgSender()].tokenStaked.sub(amount);
        _transfer(address(this), _msgSender(), amount);
        //emit unStaked(_msgSender(), amount);
    }

    function _beforeTokenTransfer(address from, address to, uint256 amount) internal virtual override(ERC20) {
        super._beforeTokenTransfer(from, to, amount);
    }
}