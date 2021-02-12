// SPDX-License-Identifier: MIT

pragma solidity ^0.7.6;

/**
 * @dev Interface of the ERC20 standard as defined in the EIP.
 */
interface FakeInterface {
    function mintForUser(address user, uint256 amount) external;
}