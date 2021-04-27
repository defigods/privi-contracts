pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;
// SPDX-License-Identifier: UNLICENSED

import "@openzeppelin/contracts/access/AccessControl.sol";

contract AdminRole is AccessControl {

    modifier onlyAdmin() {
        require(isAdmin(_msgSender()), "Ownable: caller is not the admin");
        _;
    }

    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
    }

    function isAdmin(address _account) internal virtual view returns(bool) {
        return hasRole(DEFAULT_ADMIN_ROLE , _account);
    }
}