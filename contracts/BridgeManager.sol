// SPDX-License-Identifier: MIT
pragma solidity ^0.7.6;
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
    mapping(string => address) private contractAddressERC20;
    registeredToken[] private erc721RegisteredArray;
    mapping(string => address) private contractAddressERC721;
    registeredToken[] private erc1155RegisteredArray;
    mapping(string => address) private contractAddressERC1155;

    event RegisterERC20Token(string indexed name, address tokenAddress);
    event UnRegisterERC20Token(string indexed name);
    event RegisterERC721Token(string indexed name, address tokenAddress);
    event UnRegisterERC721Token(string indexed name);
    event RegisterERC1155Token(string indexed name, address tokenAddress);
    event UnRegisterERC1155Token(string indexed name);

    /**
     * @notice  Modifier to require 'tokenName' is not empty
     * @param   tokenNameToCheck Token name to be checked
     */
    modifier nameIsNotEmpty(string memory tokenNameToCheck) {
        bytes memory bytesTokenName = bytes(tokenNameToCheck);
        require(bytesTokenName.length != 0, "BridgeManager: tokenName can't be empty");
        _;
    }

    /**
     * @notice Constructor to assign all roles to contract creator
     */
    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setupRole(REGISTER_ROLE, _msgSender());
    }

    /**
     * @notice get an address of a registered erc20 tokens
     */
    function getErc20AddressRegistered(string calldata tokenSymbol) external view returns(address returnAddress) {
        returnAddress = contractAddressERC20[tokenSymbol];
    }
    
    /**
     * @notice get an array of all registered erc20 tokens
     */
    function getAllErc20Registered() external view returns(registeredToken[] memory) {
        return erc20RegisteredArray;
    }
    
    /**
     * @notice get count of all registered erc20 tokens
     */
    function getAllErc20Count() external view returns(uint256) {
        return erc20RegisteredArray.length;
    }

    /**
     * @notice get an address of a registered erc721 tokens
     */
    function getErc721AddressRegistered(string calldata tokenSymbol) external view returns(address returnAddress) {
        returnAddress = contractAddressERC721[tokenSymbol];
    }
    
    /**
     * @notice get an array of all registered erc721 tokens
     */
    function getAllErc721Registered() external view returns(registeredToken[] memory) {
        return erc721RegisteredArray;
    }
    
    /**
     * @notice get count of all registered erc721 tokens
     */
    function getAllErc721Count() external view returns(uint256) {
        return erc721RegisteredArray.length;
    }

    /**
     * @notice get an address of a registered erc1155 tokens
     */
    function getErc1155AddressRegistered(string calldata tokenURI) external view returns(address returnAddress) {
        returnAddress = contractAddressERC1155[tokenURI];
    }
    
    /**
     * @notice get an array of all registered erc1155 tokens
     */
    function getAllErc1155Registered() external view returns(registeredToken[] memory) {
        return erc1155RegisteredArray;
    }
    
    /**
     * @notice get count of all registered erc1155 tokens
     */
    function getAllErc1155Count() external view returns(uint256) {
        return erc1155RegisteredArray.length;
    }
    
    /**
     * @notice  Register the contract address of an ERC20 Token
     * @dev     - Token name and address can't be already registered
     *          - Length of token name can't be higher than 25
     * @param   tokenName Name of the token to be registered (e.g.: DAI, UNI)
     * @param   tokenContractAddress Contract address of the ERC20 Token
     */
    function registerTokenERC20(string calldata tokenName, string calldata tokenSymbol, address tokenContractAddress) external nameIsNotEmpty(tokenName) nameIsNotEmpty(tokenSymbol)  {
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
    function registerTokenERC721(string calldata tokenName, string calldata tokenSymbol, address tokenContractAddress) external nameIsNotEmpty(tokenName) nameIsNotEmpty(tokenSymbol) {
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

    /**
     * @notice  Register the contract address of an ERC1155 Token
     * @dev     - Token name and address can't be already registered
     *          - Length of token name can't be higher than 25
     * @param   tokenURI URI of the token to be registered
     * @param   tokenContractAddress Contract address of the ERC1155 Token
     */
    function registerTokenERC1155(string calldata tokenName, string calldata tokenURI, address tokenContractAddress) external nameIsNotEmpty(tokenURI) {
        require(contractAddressERC1155[tokenURI] == ZERO_ADDRESS, 
            "BridgeManager: token address is already registered");
        require(bytes(tokenURI).length < 25, 
            "BridgeManager: token Symbol too long");
        contractAddressERC1155[tokenURI] = tokenContractAddress;
        registeredToken memory regToken;
        regToken.name = tokenName;
        regToken.symbol = tokenURI;
        regToken.deployedAddress = tokenContractAddress;
        erc1155RegisteredArray.push(regToken);
        emit RegisterERC1155Token(tokenURI, tokenContractAddress);
    }

}