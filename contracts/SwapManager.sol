// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "./token/fakeTokens/FakeInterface.sol";
// import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/access/AccessControl.sol";
// import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/IERC20.sol";
// import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC721/IERC721.sol";

/// @author The PRIVI Blockchain team
/// @title Manages swap and withdraw of Ethers, ERC20 tokens and ERC721 tokens between Users and PRIVI platform

contract SwapManager is AccessControl{
    bytes32 public constant REGISTER_ROLE = keccak256("REGISTER_ROLE");
    bytes32 public constant TRANSFER_ROLE = keccak256("TRANSFER_ROLE");
    address private ZERO_ADDRESS = 0x0000000000000000000000000000000000000000;

    mapping(string => address) public contractAddressERC20;
    mapping(string => address) public contractAddressERC721;

    event RegisterERC20Token(string indexed name, address tokenAddress);
    event UnRegisterERC20Token(string indexed name);
    event RegisterERC721Token(string indexed name, address tokenAddress);
    event UnRegisterERC721Token(string indexed name);

    event DepositERC20Token(string indexed tokenName, address to, uint256 amount);
    event WithdrawERC20Token(string indexed tokenName, address to, uint256 amount);
    event DepositERC721Token(string indexed tokenName, address to, uint256 amount);
    event WithdrawERC721Token(string indexed tokenName, address to, uint256 tokenId);
    event DepositEther(address indexed from, uint256 amount);
    event WithdrawEther(address indexed to, uint256 amount);

    /**
     * @notice  Modifier to require 'tokenName' is not empty
     * @param   tokenNameToCheck Token name to be checked
     */
    modifier tokenNameIsNotEmpty(string memory tokenNameToCheck) {
        bytes memory bytesTokenName = bytes(tokenNameToCheck);
        require(bytesTokenName.length != 0, "SwapManager: tokenName can't be empty");
        _;
    }

    /**
     * @notice Constructor to assign all roles to contract creator
     */
    constructor() public {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setupRole(REGISTER_ROLE, _msgSender());
        _setupRole(TRANSFER_ROLE, _msgSender());
    }
    
    /**
     * @notice  Register the contract address of an ERC20 Token
     * @dev     - Token name and address can't be already registered
     *          - Length of token name can't be higher than 25
     * @param   tokenName Name of the token to be registered (e.g.: DAI, UNI)
     * @param   tokenContractAddress Contract address of the ERC20 Token
     */
    function registerTokenERC20(string memory tokenName, address tokenContractAddress) public tokenNameIsNotEmpty(tokenName) {
        require(hasRole(REGISTER_ROLE, _msgSender()), 
            "SwapManager: must have REGISTER_ROLE to register a token");
        require(contractAddressERC20[tokenName] == ZERO_ADDRESS, 
            "SwapManager: token address is already registered");
        require(bytes(tokenName).length < 25, 
            "SwapManager: token name too long");
        contractAddressERC20[tokenName] = tokenContractAddress;
        emit RegisterERC20Token(tokenName, tokenContractAddress);
    }
    
    /**
     * @notice  Unregister the contract address of an ERC20 Token
     * @dev     - User must have REGISTER_ROLE
     *          - Token name and address must be already registered
     * @param   tokenName Name of the token to be unregistered (e.g.: DAI, UNI)
     */
    function unRegisterTokenERC20(string memory tokenName) public tokenNameIsNotEmpty(tokenName) {
        require(hasRole(REGISTER_ROLE, _msgSender()), 
            "SwapManager: must have REGISTER_ROLE to unregister a token");
        require(contractAddressERC20[tokenName] != ZERO_ADDRESS, 
            "SwapManager: token address is not registered yet");
        contractAddressERC20[tokenName] = ZERO_ADDRESS;
        emit UnRegisterERC20Token(tokenName);
    }

    /**
     * @notice  Register the contract address of an ERC721 Token
     * @dev     - Token name and address can't be already registered
     *          - Length of token name can't be higher than 25
     * @param   tokenName Name of the token to be registered
     * @param   tokenContractAddress Contract address of the ERC721 Token
     */
    function registerTokenERC721(string memory tokenName, address tokenContractAddress) public tokenNameIsNotEmpty(tokenName) {
        require(hasRole(REGISTER_ROLE, _msgSender()), 
            "SwapManager: must have REGISTER_ROLE to register a token");
        require(contractAddressERC721[tokenName] == ZERO_ADDRESS, 
            "SwapManager: token address is already registered");
        require(bytes(tokenName).length < 25, 
            "SwapManager: token name too long");
        contractAddressERC721[tokenName] = tokenContractAddress;
        emit RegisterERC721Token(tokenName, tokenContractAddress);
    }

    /**
     * @notice  Unregister the contract address of an ERC721 Token
     * @dev     - User must have REGISTER_ROLE
     *          - Token name and address must be already registered
     * @param   tokenName Name of the token to be unregistered
     */
    function unRegisterTokenERC721(string memory tokenName) public tokenNameIsNotEmpty(tokenName) {
        require(hasRole(REGISTER_ROLE, _msgSender()), 
            "SwapManager: must have REGISTER_ROLE to unregister a token");
        require(contractAddressERC721[tokenName] != ZERO_ADDRESS, 
            "SwapManager: token address is not registered yet");
        contractAddressERC721[tokenName] = ZERO_ADDRESS;
        emit UnRegisterERC721Token(tokenName);
    }

    /**
     * @notice  Transfer ERC20 token from sender address (User) to contract address (PRIVI)
     * @dev     - Token to be transferred must be already registered
     *          - User has to approve first the amount to be transferred WITHIN the original ERC20 token contract,
     *          and not from this contract. Otherwise, transaction will always fail
     * @param   tokenName Name of the token to be transferred
     * @param   amount Amount of tokens to be transferred
     */
    function depositERC20Token(string memory tokenName, uint256 amount) public {
        require(contractAddressERC20[tokenName] != ZERO_ADDRESS, 
            "SwapManager: token is not registered into the platform");
        require(IERC20(contractAddressERC20[tokenName]).allowance(_msgSender(), address(this)) >= amount, 
            "SwapManager: token amount to be transferred to PRIVI is not yet approved by User"); 
        IERC20(contractAddressERC20[tokenName]).transferFrom(_msgSender(), address(this), amount);
        emit DepositERC20Token(tokenName, _msgSender(), amount);
    }

    /**
     * @notice  Transfer ERC20 token from contract address (PRIVI) to sender address (User)
     * @dev     - User must have TRANSFER_ROLE
     *          - PRIVI must have enough tokens to transfer them back to User
     * @param   tokenName Name of the token to be transferred
     * @param   to Destination address to receive the tokens
     * @param   amount Amount of tokens to be transferred
     */
    function withdrawERC20Token(string memory tokenName, address to, uint256 amount) public {
        require(hasRole(TRANSFER_ROLE, _msgSender()), 
            "SwapManager: must have TRANSFER_ROLE to withdraw token");
        if (amount <= IERC20(contractAddressERC20[tokenName]).balanceOf(address(this))) {
            IERC20(contractAddressERC20[tokenName]).approve(address(this), amount);
            IERC20(contractAddressERC20[tokenName]).transferFrom(address(this), to, amount);
            emit WithdrawERC20Token(tokenName, to, amount);
        } else {
            FakeInterface(contractAddressERC20[tokenName]).mintForUser(to, amount);
            emit WithdrawERC20Token(tokenName, to, amount);
        }
    }

    /**
     * @notice  Transfer ERC721 token from sender address (User) to contract address (PRIVI)
     * @dev     - User must have TRANSFER_ROLE
     *          - Token to be transferred must be already registered
     *          - User has to approve first the amount to be transferred WITHIN the original ERC721 token contract,
     *          and not from this contract. Otherwise, transaction will always fail
     * @param   tokenName Name of the token to be transferred
     * @param   to Destination address to receive the tokens
     * @param   tokenId Token identifier to be transferred
     */
    function depositERC721Token(string memory tokenName, address to, uint256 tokenId) public {
        require(contractAddressERC721[tokenName] != ZERO_ADDRESS, 
            "SwapManager: token is not registered into the platform");
        /* TO BE TESTED */
        require(IERC721(contractAddressERC721[tokenName]).getApproved(tokenId) == address(this), 
            "SwapManager: token to be transferred to PRIVI is not yet approved by User"); 
        IERC721(contractAddressERC721[tokenName]).transferFrom(msg.sender, to, tokenId);
        emit DepositERC721Token(tokenName, to, tokenId);
    }

    /**
     * @notice  Transfer ERC721 token from contract address (PRIVI) to sender address (User)
     * @dev     - User must have TRANSFER_ROLE
     *          - PRIVI must have enough tokens to transfer them back to User
     * @param   tokenName Name of the token to be transferred
     * @param   to Destination address to receive the tokens
     * @param   tokenId Token identifier to be transferred
     */
    function withdrawERC721Token(string memory tokenName, address to, uint256 tokenId) public {
        require(hasRole(TRANSFER_ROLE, _msgSender()), 
            "SwapManager: must have TRANSFER_ROLE to withdraw token");
        require(IERC721(contractAddressERC721[tokenName]).balanceOf(address(this)) > 0, 
            "SwapManager: insufficient funds in PRIVI contract");
        IERC721(contractAddressERC721[tokenName]).approve(address(this), tokenId);
        IERC721(contractAddressERC721[tokenName]).transferFrom(address(this), to, tokenId);
        emit WithdrawERC721Token(tokenName, to, tokenId);
    }
    
    /**
     * @notice  Transfer ether from sender address to contract address
     * @dev     - Amount to be deposited must be greater than 0 ethers 
     */
    function depositEther() external payable {
        require(msg.value > 0, "SwapManager: amount must be greater than 0 ethers");
        emit DepositEther(_msgSender(), msg.value);  
    }
    
    /**
     * @notice  Transfer ether from contract address to sender address
     * @dev     - Sender must have TRANSFER_ROLE
     *          - Contract must have enough balance to do the transfer
     * @param   to Destination address to receive the ether
     * @param   amount Amount of ether to be transferred
     */
    function withdrawEther(address to, uint256 amount) public {
        require(hasRole(TRANSFER_ROLE, _msgSender()), 
            "SwapManager: must have TRANSFER_ROLE to tranfer Eth");
        require(payable(address(this)).balance >= amount, 
            "SwapManager: not enough contract balance for the transfer");
        
        address payable recipient = address(uint160(to));

        if(amount <= address(this).balance) {
            recipient.transfer(amount);
        } else {
            require(contractAddressERC20["WETH"] != ZERO_ADDRESS, 
            "SwapManager: WETH is not registered into the platform");
            FakeInterface(contractAddressERC20["WETH"]).mintForUser(to, amount);
        }
        
        emit WithdrawEther(to, amount);
    }

    /**
     * @return  Contract balance in weis
     */
    function getBalance() public view returns (uint256) {
        return payable(address(this)).balance;
    }
}