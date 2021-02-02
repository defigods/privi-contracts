// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
// import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/access/AccessControl.sol";
// import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/IERC20.sol";
// import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC721/IERC721.sol";

/// @author The PRIVI Blockchain team
/// @title Manages Bridge with ethereum, ERC20 tokens and ERC721 tokens between Users on Ethereum and PRIVI platform

contract BridgeManager is AccessControl{
    bytes32 public constant REGISTER_ROLE = keccak256("REGISTER_ROLE");
    address private ZERO_ADDRESS = 0x0000000000000000000000000000000000000000;
    
    struct registeredToken {
        string name;
        string symbol;
        address deployedAddress;
    }
    
    registeredToken[] private erc20RegisteredArray;
    mapping(string => address) public contractAddressERC20;
    registeredToken[] private erc721RegisteredArray;
    mapping(string => address) public contractAddressERC721;

    event RegisterERC20Token(string indexed name, address tokenAddress);
    event UnRegisterERC20Token(string indexed name);
    event RegisterERC721Token(string indexed name, address tokenAddress);
    event UnRegisterERC721Token(string indexed name);

    /**
     * @notice  Modifier to require 'tokenName' is not empty
     * @param   tokenNameToCheck Token name to be checked
     */
    modifier tokenNameIsNotEmpty(string memory tokenNameToCheck) {
        bytes memory bytesTokenName = bytes(tokenNameToCheck);
        require(bytesTokenName.length != 0, "BridgeManager: tokenName can't be empty");
        _;
    }

    /**
     * @notice Constructor to assign all roles to contract creator
     */
    constructor() public {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setupRole(REGISTER_ROLE, _msgSender());
    }
    
    /**
     * @notice get an array of all registeder erc20 tokens
     */
    function getAllErc20Registered() public view returns(registeredToken[] memory) {
        return erc20RegisteredArray;
    }
    
    /**
     * @notice get count of all registeder erc20 tokens
     */
    function getAllErc20Count() public view returns(uint256) {
        return erc20RegisteredArray.length;
    }
    
    /**
     * @notice get an array of all registeder erc721 tokens
     */
    function getAllErc721Registered() public view returns(registeredToken[] memory) {
        return erc721RegisteredArray;
    }
    
    /**
     * @notice get count of all registeder erc721 tokens
     */
    function getAllErc721Count() public view returns(uint256) {
        return erc721RegisteredArray.length;
    }
    
    /**
     * @notice  Register the contract address of an ERC20 Token
     * @dev     - Token name and address can't be already registered
     *          - Length of token name can't be higher than 25
     * @param   tokenName Name of the token to be registered (e.g.: DAI, UNI)
     * @param   tokenContractAddress Contract address of the ERC20 Token
     */
    function registerTokenERC20(string memory tokenName, string memory tokenSymbol, address tokenContractAddress) public tokenNameIsNotEmpty(tokenName) tokenNameIsNotEmpty(tokenSymbol)  {
        require(contractAddressERC20[tokenSymbol] == ZERO_ADDRESS, 
            "BridgeManager: token address is already registered");
        require(bytes(tokenSymbol).length < 25, 
            "BridgeManager: token Symbol too long");
        contractAddressERC20[tokenSymbol] = tokenContractAddress;
        registeredToken memory regToken;
        regToken.name = tokenName;
        regToken.symbol = tokenSymbol;
        regToken.deployedAddress = tokenContractAddress;
        erc20RegisteredArray.push(regToken);
        emit RegisterERC20Token(tokenSymbol, tokenContractAddress);
    }

    /**
     * @notice  Register the contract address of an ERC721 Token
     * @dev     - Token name and address can't be already registered
     *          - Length of token name can't be higher than 25
     * @param   tokenName Name of the token to be registered
     * @param   tokenContractAddress Contract address of the ERC721 Token
     */
    function registerTokenERC721(string memory tokenName, string memory tokenSymbol, address tokenContractAddress) public tokenNameIsNotEmpty(tokenName) tokenNameIsNotEmpty(tokenSymbol) {
        // require(hasRole(REGISTER_ROLE, _msgSender()), 
        //     "BridgeManager: must have REGISTER_ROLE to register a token");
        require(contractAddressERC721[tokenSymbol] == ZERO_ADDRESS, 
            "BridgeManager: token address is already registered");
        require(bytes(tokenSymbol).length < 25, 
            "BridgeManager: token Symbol too long");
        contractAddressERC721[tokenSymbol] = tokenContractAddress;
        registeredToken memory regToken;
        regToken.name = tokenName;
        regToken.symbol = tokenSymbol;
        regToken.deployedAddress = tokenContractAddress;
        erc721RegisteredArray.push(regToken);
        emit RegisterERC721Token(tokenSymbol, tokenContractAddress);
    }

}