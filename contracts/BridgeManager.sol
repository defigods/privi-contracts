// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
// pragma experimental ABIEncoderV2; // SJS: not needed with pragma v0.8

import "@openzeppelin/contracts/access/AccessControl.sol";

// import "@openzeppelin/contracts/token/ERC20/IERC20.sol"; // SJS: already in SwapManager.sol
// import "@openzeppelin/contracts/token/ERC721/IERC721.sol"; // SJS: already in SwapManager.sol

/// @author The PRIVI Blockchain team
/// @title Manages Bridge with ethereum, ERC20 tokens and ERC721 tokens between Users on Ethereum and PRIVI platform

contract BridgeManager is AccessControl {
  bytes32 public constant REGISTER_ROLE = keccak256("REGISTER_ROLE");
  address private constant ZERO_ADDRESS =
    0x0000000000000000000000000000000000000000;

  // Structure to handle registered token data
  struct registeredToken {
    string name;
    string symbol;
    address deployedAddress;
  }

  // ERC20 token types
  registeredToken[] private erc20RegisteredArray;
  mapping(string => address) private contractAddressERC20;

  // ERC721 token types
  registeredToken[] private erc721RegisteredArray;
  mapping(string => address) private contractAddressERC721;

  // ERC1155 token types
  registeredToken[] private erc1155RegisteredArray;
  mapping(string => address) private contractAddressERC1155;

  event RegisterERC20Token(string indexed name, address tokenAddress);
  event UnRegisterERC20Token(string indexed name);
  event RegisterERC721Token(string indexed name, address tokenAddress);
  event UnRegisterERC721Token(string indexed name);
  event RegisterERC1155Token(string indexed name, address tokenAddress);
  event UnRegisterERC1155Token(string indexed name);

  /**
   * @notice  Modifier to require 'tokenName' and 'tokenSymbol' are not empty
   * @param   tokenNameToCheck The token or symbol name to be checked
   * @dev     reverts if tokenNameToCheck is empty
   */
  modifier nameIsNotEmpty(string memory tokenNameToCheck) {
    bytes memory bytesTokenName = bytes(tokenNameToCheck);
    require(
      bytesTokenName.length != 0,
      "BridgeManager: token name and symbol can't be empty"
    );
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
   * @notice Get the contract address of a registered ERC20 token
   */
  function getErc20AddressRegistered(string calldata tokenSymbol)
    external
    view
    returns (address returnAddress)
  {
    returnAddress = contractAddressERC20[tokenSymbol];
  }

  /**
   * @notice Get an array of all registered ERC20 tokens
   */
  function getAllErc20Registered()
    external
    view
    returns (registeredToken[] memory)
  {
    return erc20RegisteredArray;
  }

  /**
   * @notice Get count of all registered ERC20 tokens
   */
  function getAllErc20Count() external view returns (uint256) {
    return erc20RegisteredArray.length;
  }

  /**
   * @notice Get the contract address of a registered ERC721 token
   */
  function getErc721AddressRegistered(string calldata tokenSymbol)
    external
    view
    returns (address returnAddress)
  {
    returnAddress = contractAddressERC721[tokenSymbol];
  }

  /**
   * @notice Get an array of all registered ERC721 tokens
   */
  function getAllErc721Registered()
    external
    view
    returns (registeredToken[] memory)
  {
    return erc721RegisteredArray;
  }

  /**
   * @notice Get count of all registered ERC721 tokens
   */
  function getAllErc721Count() external view returns (uint256) {
    return erc721RegisteredArray.length;
  }

  /**
   * @notice Get the address of a registered ERC1155 token
   */
  function getErc1155AddressRegistered(string calldata tokenURI)
    external
    view
    returns (address returnAddress)
  {
    returnAddress = contractAddressERC1155[tokenURI];
  }

  /**
   * @notice Get an array of all registered ERC1155 tokens
   */
  function getAllErc1155Registered()
    external
    view
    returns (registeredToken[] memory)
  {
    return erc1155RegisteredArray;
  }

  /**
   * @notice Get count of all registered ERC1155 tokens
   */
  function getAllErc1155Count() external view returns (uint256) {
    return erc1155RegisteredArray.length;
  }

  /**
   * @notice  Register the contract address of an ERC20 token
   * @dev     - Token name and address can't be already registered
   *          - Length of token name and symbol can't be above 25 characters
   * @param   tokenName The name of the token to be registered (e.g.: Uniswap)
   * @param   tokenSymbol The symbol of the token to be registered (e.g.: UNI)
   * @param   tokenContractAddress The contract address of the ERC20 Token
   */
  function registerTokenERC20(
    string calldata tokenName,
    string calldata tokenSymbol,
    address tokenContractAddress
  ) external nameIsNotEmpty(tokenName) nameIsNotEmpty(tokenSymbol) {
    require(
      contractAddressERC20[tokenSymbol] == ZERO_ADDRESS,
      "BridgeManager: token address is already registered"
    );
    require(
      bytes(tokenSymbol).length < 25,
      "BridgeManager: token Symbol too long"
    );
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
   *          - Length of token name and symbol can't be above 25 characters
   * @param   tokenName The name of the token to be registered (e.g.: Uniswap)
   * @param   tokenSymbol The symbol of the token to be registered (e.g.: UNI)
   * @param   tokenContractAddress Contract address of the ERC721 token
   */
  function registerTokenERC721(
    string calldata tokenName,
    string calldata tokenSymbol,
    address tokenContractAddress
  ) external nameIsNotEmpty(tokenName) nameIsNotEmpty(tokenSymbol) {
    // require(hasRole(REGISTER_ROLE, _msgSender()),
    //     "BridgeManager: must have REGISTER_ROLE to register a token");
    require(
      contractAddressERC721[tokenSymbol] == ZERO_ADDRESS,
      "BridgeManager: token address is already registered" //TODO: token symbol already registered
    );
    require(
      bytes(tokenSymbol).length < 25,
      "BridgeManager: token Symbol too long"
    );
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
   *          - Length of token name and symbol can't be above 25 characters
   * @param   tokenName The name of the token to be registered (e.g.: Kitty)
   * @param   tokenURI The URI of the token to be registered
   * @param   tokenContractAddress Contract address of the ERC1155 token
   */
  function registerTokenERC1155(
    string calldata tokenName,
    string calldata tokenURI,
    address tokenContractAddress
  ) external nameIsNotEmpty(tokenURI) {
    require(
      contractAddressERC1155[tokenURI] == ZERO_ADDRESS,
      "BridgeManager: token address is already registered"
    );
    require(
      bytes(tokenURI).length < 25,
      "BridgeManager: token Symbol too long"
    );
    contractAddressERC1155[tokenURI] = tokenContractAddress;
    registeredToken memory regToken;
    regToken.name = tokenName;
    regToken.symbol = tokenURI;
    regToken.deployedAddress = tokenContractAddress;
    erc1155RegisteredArray.push(regToken);
    emit RegisterERC1155Token(tokenURI, tokenContractAddress);
  }
}
