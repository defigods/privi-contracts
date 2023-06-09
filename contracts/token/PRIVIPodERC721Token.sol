// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";

/**
 * @dev {ERC20} token, including:
 *
 *  - ability for holders to burn (destroy) their tokens
 *  - a factoryOnly modifier, that grants mint capabilities only to factory who deployed this pod token contract
 *
 */
contract PRIVIPodERC721Token is Context, ERC721Burnable {
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
    address factory
  ) ERC721(name, symbol) {
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
  function mint(address to, uint256 tokenId) public virtual onlyFactory {
    // We cannot just use balanceOf to create the new tokenId because tokens
    _mint(to, tokenId);
  }

  function _beforeTokenTransfer(
    address from,
    address to,
    uint256 tokenId
  ) internal virtual override(ERC721) {
    super._beforeTokenTransfer(from, to, tokenId);
  }
}
