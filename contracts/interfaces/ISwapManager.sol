// SPDX-License-Identifier: MIT
pragma solidity ^0.7.6;

/// @author The PRIVI Blockchain team
/// @title Manages swap and withdraw of Ethers, ERC20 tokens and ERC721 tokens between Users and PRIVI platform

interface ISwapManager {
  event DepositERC20Token(
    string indexed tokenSymbol,
    address from,
    uint256 amount
  );
  event WithdrawERC20Token(
    string indexed tokenSymbol,
    address to,
    uint256 amount
  );
  event DepositERC721Token(
    string indexed tokenSymbol,
    address from,
    uint256 amount
  );
  event WithdrawERC721Token(
    string indexed tokenSymbol,
    address to,
    uint256 tokenId
  );
  event DepositERC1155Token(
    string indexed tokenURI,
    address to,
    uint256 tokenId,
    uint256 amount
  );
  event WithdrawERC1155Token(
    string indexed tokenURI,
    address to,
    uint256 tokenId,
    uint256 amount
  );
  event DepositEther(address indexed from, uint256 amount);
  event WithdrawEther(address indexed to, uint256 amount);

  /**
   * @notice  Transfer ERC20 token from sender address (User) to contract address (PRIVI)
   * @dev     - Token to be transferred must be already registered
   *          - User has to approve first the amount to be transferred WITHIN the original ERC20 token contract,
   *          and not from this contract. Otherwise, transaction will always fail
   * @param   tokenSymbol Name of the token to be transferred
   * @param   amount Amount of tokens to be transferred
   */
  function depositERC20Token(string calldata tokenSymbol, uint256 amount)
    external;

  /**
   * @notice  Transfer ERC20 token from contract address (PRIVI) to sender address (User)
   * @dev     - User must have TRANSFER_ROLE
   *          - PRIVI must have enough tokens to transfer them back to User
   * @param   tokenSymbol Name of the token to be transferred
   * @param   to Destination address to receive the tokens
   * @param   amount Amount of tokens to be transferred
   */
  function withdrawERC20Token(
    string calldata tokenSymbol,
    address to,
    uint256 amount
  ) external;

  /**
   * @notice  Transfer ERC721 token from sender address (User) to contract address (PRIVI)
   * @dev     - User must have TRANSFER_ROLE
   *          - Token to be transferred must be already registered
   *          - User has to approve first the amount to be transferred WITHIN the original ERC721 token contract,
   *          and not from this contract. Otherwise, transaction will always fail
   * @param   tokenSymbol Name of the token to be transferred
   * @param   tokenId Token identifier to be transferred
   */
  function depositERC721Token(string calldata tokenSymbol, uint256 tokenId)
    external;

  /**
   * @notice  Transfer ERC721 token from contract address (PRIVI) to sender address (User)
   * @dev     - User must have TRANSFER_ROLE
   *          - PRIVI must have enough tokens to transfer them back to User
   * @param   tokenSymbol Name of the token to be transferred
   * @param   to Destination address to receive the tokens
   * @param   tokenId Token identifier to be transferred
   * @param   isPodMint is it a withdraw from swap manager or is it minting new nft pod token
   */
  function withdrawERC721Token(
    string calldata tokenSymbol,
    address to,
    uint256 tokenId,
    bool isPodMint
  ) external;

  /**
   * @notice  Transfer ERC1155 token from sender address (User) to contract address (PRIVI)
   * @dev     - User must have TRANSFER_ROLE
   *          - Token to be transferred must be already registered
   *          - User has to approve first the amount to be transferred WITHIN the original ERC1155 token contract,
   *          and not from this contract. Otherwise, transaction will always fail
   * @param   tokenURI Name of the token to be transferred
   * @param   to Destination address to receive the tokens
   * @param   tokenId Token identifier to be transferred
   */
  function depositERC1155Token(
    string calldata tokenURI,
    address to,
    uint256 tokenId,
    uint256 amount,
    bytes memory data
  ) external;

  /**
   * @notice  Transfer ERC1155 token from contract address (PRIVI) to sender address (User)
   * @dev     - User must have TRANSFER_ROLE
   *          - PRIVI must have enough tokens to transfer them back to User
   * @param   tokenURI Name of the token to be transferred
   * @param   to Destination address to receive the tokens
   * @param   tokenId Token identifier to be transferred
   */
  function withdrawERC1155Token(
    string calldata tokenURI,
    address to,
    uint256 tokenId,
    uint256 amount,
    bytes memory data
  ) external;

  /**
   * @notice  Transfer ether from sender address to contract address
   * @dev     - Amount to be deposited must be greater than 0 ethers
   */
  function depositEther() external payable;

  /**
   * @notice  Transfer ether from contract address to sender address
   * @dev     - Sender must have TRANSFER_ROLE
   *          - Contract must have enough balance to do the transfer
   * @param   to Destination address to receive the ether
   * @param   amount Amount of ether to be transferred
   */
  function withdrawEther(address to, uint256 amount) external;

  /**
   * @return  Contract balance in weis
   */
  function getBalance() external view returns (uint256);
}
