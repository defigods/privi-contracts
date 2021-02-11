// SPDX-License-Identifier: MIT
pragma solidity ^0.7.6;
pragma experimental ABIEncoderV2;

interface IBridgeManager {
    
    struct registeredToken {
        string name;
        string symbol;
        address deployedAddress;
    }
    
    /**
     * @notice get an address of a registered erc20 tokens
     */
    function getErc20AddressRegistered(string calldata tokenSymbol) external view returns(address returnAddress);
    
    /**
     * @notice get an array of all registered erc20 tokens
     */
    function getAllErc20Registered() external view returns(registeredToken[] memory);
    
    /**
     * @notice get count of all registered erc20 tokens
     */
    function getAllErc20Count() external view returns(uint256);

    /**
     * @notice check if ERC20 token is deployed via factory
     */
    function isErc20ContractDeployedViaFactory(string calldata tokenSymbol) external view returns(bool);

    /**
     * @notice get an address of a registered erc721 tokens
     */
    function getErc721AddressRegistered(string calldata tokenSymbol) external view returns(address returnAddress);
    
    /**
     * @notice get an array of all registered erc721 tokens
     */
    function getAllErc721Registered() external view returns(registeredToken[] memory);
    
    /**
     * @notice get count of all registered erc721 tokens
     */
    function getAllErc721Count() external view returns(uint256);

    /**
     * @notice check if ERC721 token is deployed via factory
     */
    function isErc721ContractDeployedViaFactory(string calldata tokenSymbol) external view returns(bool);

    /**
     * @notice get an address of a registered erc1155 tokens
     */
    function getErc1155AddressRegistered(string calldata tokenURI) external view returns(address returnAddress);
    
    /**
     * @notice get an array of all registered erc1155 tokens
     */
    function getAllErc1155Registered() external view returns(registeredToken[] memory);
    
    /**
     * @notice get count of all registered erc1155 tokens
     */
    function getAllErc1155Count() external view returns(uint256);
    
    /**
     * @notice  Register the contract address of an ERC20 Token
     * @dev     - Token name and address can't be already registered
     *          - Length of token name can't be higher than 25
     * @param   tokenName Name of the token to be registered (e.g.: DAI, UNI)
     * @param   tokenContractAddress Contract address of the ERC20 Token
     */
    function registerTokenERC20(string calldata tokenName, string calldata tokenSymbol, address tokenContractAddress, bool isViaFactory) external;

    /**
     * @notice  Register the contract address of an ERC721 Token
     * @dev     - Token name and address can't be already registered
     *          - Length of token name can't be higher than 25
     * @param   tokenName Name of the token to be registered
     * @param   tokenContractAddress Contract address of the ERC721 Token
     */
    function registerTokenERC721(string calldata tokenName, string calldata tokenSymbol, address tokenContractAddress, bool isViaFactory) external;

    /**
     * @notice  Register the contract address of an ERC1155 Token
     * @dev     - Token name and address can't be already registered
     *          - Length of token name can't be higher than 25
     * @param   tokenURI URI of the token to be registered
     * @param   tokenContractAddress Contract address of the ERC1155 Token
     */
    function registerTokenERC1155(string calldata tokenName, string calldata tokenURI, address tokenContractAddress) external;

}