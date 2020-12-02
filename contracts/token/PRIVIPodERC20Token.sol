// SPDX-License-Identifier: MIT

pragma solidity ^0.6.12;

import "@openzeppelin/contracts/GSN/Context.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol";

/**
 * @dev {ERC20} token, including:
 *
 *  - ability for holders to burn (destroy) their tokens
 *  - a factoryOnly modifier, that grants mint capabilities only to factory who deployed theis pod token contract
 *
 */
contract PRIVIPodERC20Token is Context, ERC20Burnable {

    address public parentFactory;

    /**
     * @dev sets factory address
     *
     * See {ERC20-constructor}.
     */
    constructor(string memory name, string memory symbol, address factory) public ERC20(name, symbol) {
        parentFactory = factory;
    }

    modifier onlyFactory() {
        require(_msgSender() == parentFactory, "PRIVIPodERC20Token: Only Factory can call this function.");
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
    function mint(address to, uint256 amount) public virtual onlyFactory{
        _mint(to, amount);
    }

    function _beforeTokenTransfer(address from, address to, uint256 amount) internal virtual override(ERC20) {
        super._beforeTokenTransfer(from, to, amount);
    }
}
