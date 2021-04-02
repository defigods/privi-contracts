// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "../abstracts/NFTRoyalty.sol";

/**
 * @dev {ERC20} token, including:
 *
 *  - ability for holders to burn (destroy) their tokens
 *  - a factoryOnly modifier, that grants mint capabilities only to factory who deployed this pod token contract
 *
 */
contract PRIVIPodERC721TokenRoyalty is Context, ERC721Burnable, NFTRoyalty {
  using Counters for Counters.Counter;
  Counters.Counter private _tokenIdTracker;
  address public parentFactory;

  string private _baseTokenURI;

  /**
   * @dev Sets factory address
   *
   * See {ERC20-constructor}.
   */
  constructor(
    string memory name,
    string memory symbol,
    string memory baseURI,
    address factory,
    uint256 royaltyAmount,
    address creator
  ) ERC721(name, symbol) NFTRoyalty(royaltyAmount, creator) {
    parentFactory = factory;
    _baseTokenURI = baseURI;
  }

  modifier onlyFactory() {
    require(
      _msgSender() == parentFactory,
      "PRIVIPodERC721Token: Only Factory can call this function."
    );
    _;
  }

  function _baseURI() internal view virtual override returns (string memory) {
    return _baseTokenURI;
  }

  /**
   * @dev Creates `amount` new tokens for `to`.
   *
   * See {ERC20-_mint}.
   *
   * Requirements:
   *
   * - the caller must be factory only.
   */
  function mint(address to) public virtual onlyFactory {
    // We cannot just use balanceOf to create the new tokenId because tokens
    // can be burned (destroyed), so we need a separate counter.
    _mint(to, _tokenIdTracker.current());
    _tokenIdTracker.increment();
  }

  /**
   * @dev Safely transfers `tokenId` token from `from` to `to`, checking first that contract recipients
   * are aware of the ERC721 protocol to prevent tokens from being forever locked.
   * Then pay royalty amount.
   *
   * Requirements:
   *
   * - approval from current owner of token id
   *
   * Emits a {RecievedRoyalties} event.
   *
   * Problems: TODO: may have reentrancy
   */
  function marketSell(
    uint256 sellAmount,
    uint256 tokenId,
    address from,
    address to
  ) public payable {
    // make sure all the fund is deposited here first
    require(
      msg.value == sellAmount,
      "PRIVIPodERC721TokenRoyalty: royalty amount is not correct"
    );

    // pay creator
    uint256 creatorShare = (msg.value * royalty_amount) / 100;
    //uint256 creatorShare = (msg.value.mul(royalty_amount)).div(100); // TODO: needs testing for very low and hi amount
    address payable royaltyOwner = payable(creator);
    royaltyOwner.transfer(creatorShare);

    // pay current owner
    //payable(from).transfer(msg.value.sub(creatorShare));
    payable(from).transfer(msg.value - creatorShare);

    // transfer token
    safeTransferFrom(from, to, tokenId, bytes("royalty paid"));

    // event
    royaltiesRecieved(creator, to, creatorShare);
  }

  function _beforeTokenTransfer(
    address from,
    address to,
    uint256 tokenId
  ) internal virtual override(ERC721) {
    super._beforeTokenTransfer(from, to, tokenId);
  }
}
