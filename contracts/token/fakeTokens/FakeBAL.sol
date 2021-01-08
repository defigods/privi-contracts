pragma solidity ^0.6.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract FakeBAL is ERC20, AccessControl {
    bytes32 public constant NO_LIMIT_ROLE = keccak256("NO_LIMIT_ROLE");

    address payable public owner;
    
    mapping(address => uint256) lastIssuedTime;
    
    constructor() ERC20("FakeBAL", "fBAL") public {
        owner = msg.sender;
        _setupRole(NO_LIMIT_ROLE, _msgSender());
    }
    
    modifier onceADay () {
        uint256 userLastIssueTime = lastIssuedTime[msg.sender];
        require(now - userLastIssueTime > 86400, "You are allowed to only participate once a day."); // once a day
        _;
    }
    
    modifier limmitedAmount () {
        require(msg.value <= 1 ether, "No more than 1 ether is not allowed."); // once a day
        _;
    }

    function participate() onceADay limmitedAmount public payable {
        lastIssuedTime[msg.sender] = now;
        owner.transfer(msg.value);
        _mint(msg.sender, msg.value.mul(1000));
    }

    function burn(uint256 amount) public {
        _burn(msg.sender, amount);
    }

    function participateNoLimit() public payable {
        require(hasRole(NO_LIMIT_ROLE, _msgSender()), "SwapManager: must have NO_LIMIT_ROLE role to mint no limit tokens");

        lastIssuedTime[msg.sender] = now;
        owner.transfer(msg.value);
        _mint(msg.sender, msg.value.mul(1000));
    }
}