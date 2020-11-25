// SPDX-License-Identifier: MIT

pragma solidity ^0.6.12;

import "@openzeppelin/contracts/GSN/Context.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol";

contract TestToken is Context, ERC20, ERC20Burnable {    
    
    string constant TOKEN_NAME = 'Test Token';
    string constant TOKEN_SYMBOL = 'TESTS';

    constructor() public ERC20(TOKEN_NAME, TOKEN_SYMBOL) {
        _mint(msg.sender, 1000);
    }

    function mint(uint256 amount) public {
        _mint(msg.sender, amount);
    }

    function _beforeTokenTransfer(address from, address to, uint256 amount) internal virtual override(ERC20) {
        super._beforeTokenTransfer(from, to, amount);
    }
}