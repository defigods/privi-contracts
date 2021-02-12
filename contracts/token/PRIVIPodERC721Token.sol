// SPDX-License-Identifier: MIT

pragma solidity ^0.7.6;

import "@openzeppelin/contracts/GSN/Context.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721Burnable.sol";

/**
 * @dev {ERC20} token, including:
 *
 *  - ability for holders to burn (destroy) their tokens
 *  - a factoryOnly modifier, that grants mint capabilities only to factory who deployed this pod token contract
 *
 */
contract PRIVIPodERC721Token is Context, ERC721Burnable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdTracker;
    address public parentFactory;

    /**
     * @dev Sets factory address
     *
     * See {ERC20-constructor}.
     */
    constructor(string memory name, string memory symbol, string memory baseURI, address factory) ERC721(name, symbol) {
        parentFactory = factory;
        _setBaseURI(baseURI);
    }

    modifier onlyFactory() {
        require(_msgSender() == parentFactory, "PRIVIPodERC721Token: Only Factory can call this function.");
        _;
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
    function mint(address to) public virtual onlyFactory{
        // We cannot just use balanceOf to create the new tokenId because tokens
        // can be burned (destroyed), so we need a separate counter.
        _mint(to, _tokenIdTracker.current());
        _tokenIdTracker.increment();
    }

    function _beforeTokenTransfer(address from, address to, uint256 tokenId) internal virtual override(ERC721) {
        super._beforeTokenTransfer(from, to, tokenId);
    }
}
