// SPDX-License-Identifier: MIT
pragma solidity ^0.7.6;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "./token/interfaces/FakeInterface.sol";
import "./interfaces/IBridgeManager.sol";
import "./interfaces/IPRIVIPodERC20Factory.sol";
import "./interfaces/IPRIVIPodERC721Factory.sol";

/// @author The PRIVI Blockchain team
/// @title Manages swap and withdraw of Ethers, ERC20 tokens and ERC721 tokens between Users and PRIVI platform

contract SwapManager is AccessControl{
    // bytes32 public constant REGISTER_ROLE = keccak256("REGISTER_ROLE");
    bytes32 public constant TRANSFER_ROLE = keccak256("TRANSFER_ROLE");
    address private ZERO_ADDRESS = 0x0000000000000000000000000000000000000000;
    address public bridgeManagerAddress;
    address public erc20FactoryAddress;
    address public erc721FactoryAddress;

    event DepositERC20Token(string indexed tokenSymbol, address to, uint256 amount);
    event WithdrawERC20Token(string indexed tokenSymbol, address to, uint256 amount);
    event DepositERC721Token(string indexed tokenSymbol, address to, uint256 amount);
    event WithdrawERC721Token(string indexed tokenSymbol, address to, uint256 tokenId);
    // event DepositERC1155Token(string indexed tokenSymbol, address to, uint256 amount);
    // event WithdrawERC1155Token(string indexed tokenSymbol, address to, uint256 tokenId);
    event DepositEther(address indexed from, uint256 amount);
    event WithdrawEther(address indexed to, uint256 amount);

    /**
     * @notice  Modifier to require 'tokenSymbol' is not empty
     * @param   tokenSymbolToCheck Token name to be checked
     */
    modifier tokenNameIsNotEmpty(string memory tokenNameToCheck) {
        bytes memory bytesTokenName = bytes(tokenNameToCheck);
        require(bytesTokenName.length != 0, "SwapManager: tokenName can't be empty");
        _;
    }

    /**
     * @notice Constructor to assign all roles to contract creator
     */
    constructor(address bridgeDeployedAddress, address erc20FactoryDeployedAddress, address erc721FactoryDeployedAddress) {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        // _setupRole(REGISTER_ROLE, _msgSender());
        _setupRole(TRANSFER_ROLE, _msgSender());
        bridgeManagerAddress = bridgeDeployedAddress;
        erc20FactoryAddress = erc20FactoryDeployedAddress;
        erc721FactoryAddress = erc721FactoryDeployedAddress;
    }

    /**
     * @notice  Transfer ERC20 token from sender address (User) to contract address (PRIVI)
     * @dev     - Token to be transferred must be already registered
     *          - User has to approve first the amount to be transferred WITHIN the original ERC20 token contract,
     *          and not from this contract. Otherwise, transaction will always fail
     * @param   tokenSymbol Name of the token to be transferred
     * @param   amount Amount of tokens to be transferred
     */
    function depositERC20Token(string memory tokenSymbol, uint256 amount) public {
        IBridgeManager bManager = IBridgeManager(bridgeManagerAddress);
        address tokenAddress = bManager.getErc20AddressRegistered(tokenSymbol);
        require(tokenAddress != ZERO_ADDRESS, 
            "SwapManager: token is not registered into the platform");
        require(IERC20(tokenAddress).allowance(_msgSender(), address(this)) >= amount, 
            "SwapManager: token amount to be transferred to PRIVI is not yet approved by User"); 
        IERC20(tokenAddress).transferFrom(_msgSender(), address(this), amount);
        emit DepositERC20Token(tokenSymbol, _msgSender(), amount);
    }

    /**
     * @notice  Transfer ERC20 token from contract address (PRIVI) to sender address (User)
     * @dev     - User must have TRANSFER_ROLE
     *          - PRIVI must have enough tokens to transfer them back to User
     * @param   tokenSymbol Name of the token to be transferred
     * @param   to Destination address to receive the tokens
     * @param   amount Amount of tokens to be transferred
     */
    function withdrawERC20Token(string memory tokenSymbol, address to, uint256 amount) public {
        IBridgeManager bManager = IBridgeManager(bridgeManagerAddress);
        address tokenAddress = bManager.getErc20AddressRegistered(tokenSymbol);
        require(hasRole(TRANSFER_ROLE, _msgSender()), 
            "SwapManager: must have TRANSFER_ROLE to withdraw token");
        if (amount <= IERC20(tokenAddress).balanceOf(address(this))) {
            IERC20(tokenAddress).approve(address(this), amount);
            IERC20(tokenAddress).transferFrom(address(this), to, amount);
            emit WithdrawERC20Token(tokenSymbol, to, amount);
        } else if (IPRIVIPodERC20Factory(erc20FactoryAddress).getPodAddressBySymbol(tokenSymbol) != ZERO_ADDRESS) {
            IPRIVIPodERC20Factory(erc20FactoryAddress).mintPodTokenBySymbol(tokenSymbol, to, amount);
            emit WithdrawERC20Token(tokenSymbol, to, amount);
        } else { // only for testnet fake tokens
            FakeInterface(tokenAddress).mintForUser(to, amount);
            emit WithdrawERC20Token(tokenSymbol, to, amount);
        }
    }

    /**
     * @notice  Transfer ERC721 token from sender address (User) to contract address (PRIVI)
     * @dev     - User must have TRANSFER_ROLE
     *          - Token to be transferred must be already registered
     *          - User has to approve first the amount to be transferred WITHIN the original ERC721 token contract,
     *          and not from this contract. Otherwise, transaction will always fail
     * @param   tokenSymbol Name of the token to be transferred
     * @param   to Destination address to receive the tokens
     * @param   tokenId Token identifier to be transferred
     */
    function depositERC721Token(string memory tokenSymbol, uint256 tokenId) public {
        IBridgeManager bManager = IBridgeManager(bridgeManagerAddress);
        address tokenAddress = bManager.getErc721AddressRegistered(tokenSymbol);
        require(tokenAddress != ZERO_ADDRESS, 
            "SwapManager: token is not registered into the platform");
        /* TO BE TESTED */
        require(IERC721(tokenAddress).getApproved(tokenId) == address(this), 
            "SwapManager: token to be transferred to PRIVI is not yet approved by User"); 
        IERC721(tokenAddress).transferFrom(msg.sender, address(this), tokenId);
        emit DepositERC721Token(tokenSymbol, to, tokenId);
    }

    /**
     * @notice  Transfer ERC721 token from contract address (PRIVI) to sender address (User)
     * @dev     - User must have TRANSFER_ROLE
     *          - PRIVI must have enough tokens to transfer them back to User
     * @param   tokenSymbol Name of the token to be transferred
     * @param   to Destination address to receive the tokens
     * @param   tokenId Token identifier to be transferred
     */
    function withdrawERC721Token(string memory tokenSymbol, address to, uint256 tokenId) public {
        IBridgeManager bManager = IBridgeManager(bridgeManagerAddress);
        address tokenAddress = bManager.getErc721AddressRegistered(tokenSymbol);
        require(hasRole(TRANSFER_ROLE, _msgSender()), 
            "SwapManager: must have TRANSFER_ROLE to withdraw token");
        if (IERC721(tokenAddress).ownerOf(tokenId) == address(this)) {
            IERC721(tokenAddress).approve(address(this), tokenId);
            IERC721(tokenAddress).transferFrom(address(this), to, tokenId);
            emit WithdrawERC721Token(tokenSymbol, to, tokenId);
        } else if (IPRIVIPodERC721Factory(erc721FactoryAddress).getPodAddressBySymbol(tokenSymbol) != ZERO_ADDRESS) {
            IPRIVIPodERC721Factory(erc721FactoryAddress).mintPodTokenBySymbol(tokenSymbol, to);
            emit WithdrawERC721Token(tokenSymbol, to, tokenId);
        } else {
            revert();
        }
        
    }

    /**
     * @notice  Transfer ERC1155 token from sender address (User) to contract address (PRIVI)
     * @dev     - User must have TRANSFER_ROLE
     *          - Token to be transferred must be already registered
     *          - User has to approve first the amount to be transferred WITHIN the original ERC1155 token contract,
     *          and not from this contract. Otherwise, transaction will always fail
     * @param   tokenSymbol Name of the token to be transferred
     * @param   to Destination address to receive the tokens
     * @param   tokenId Token identifier to be transferred
     */
    // function depositERC1155Token(string memory tokenSymbol, address to, uint256 tokenId) public {
    //     IBridgeManager bManager = IBridgeManager(bridgeManagerAddress);
    //     address tokenAddress = bManager.getErc1155AddressRegistered(tokenSymbol);
    //     require(tokenAddress != ZERO_ADDRESS, 
    //         "SwapManager: token is not registered into the platform");
    //     /* TO BE TESTED */
    //     require(IERC1155(tokenAddress).getApproved(tokenId) == address(this), 
    //         "SwapManager: token to be transferred to PRIVI is not yet approved by User"); 
    //     IERC1155(tokenAddress).transferFrom(msg.sender, to, tokenId);
    //     emit DepositERC1155Token(tokenSymbol, to, tokenId);
    // }

    /**
     * @notice  Transfer ERC1155 token from contract address (PRIVI) to sender address (User)
     * @dev     - User must have TRANSFER_ROLE
     *          - PRIVI must have enough tokens to transfer them back to User
     * @param   tokenSymbol Name of the token to be transferred
     * @param   to Destination address to receive the tokens
     * @param   tokenId Token identifier to be transferred
     */
    // function withdrawERC1155Token(string memory tokenSymbol, address to, uint256 tokenId) public {
    //     IBridgeManager bManager = IBridgeManager(bridgeManagerAddress);
    //     address tokenAddress = bManager.getErc1155AddressRegistered(tokenSymbol);
    //     require(hasRole(TRANSFER_ROLE, _msgSender()), 
    //         "SwapManager: must have TRANSFER_ROLE to withdraw token");
    //     require(IERC1155(tokenAddress).balanceOf(address(this)) > 0, 
    //         "SwapManager: insufficient funds in PRIVI contract");
    //     IERC1155(tokenAddress).approve(address(this), tokenId);
    //     IERC1155(tokenAddress).transferFrom(address(this), to, tokenId);
    //     emit WithdrawERC1155Token(tokenSymbol, to, tokenId);
    // }
    
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