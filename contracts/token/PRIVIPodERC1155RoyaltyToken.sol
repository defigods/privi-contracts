// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";
import "../abstracts/NFTRoyalty.sol";

/**
 * @dev {ERC1155} token, including:
 *
 *  - ability for holders to burn (destroy) their tokens
 *  - a factoryOnly modifier, that grants mint capabilities only to factory who deployed theis pod token contract
 */
contract PRIVIPodERC1155TokenRoyalty is Context, ERC1155Burnable, NFTRoyalty {
  address public parentFactory;

  /**
   * @dev Sets factory address
   * deploys the contract.
   */
  constructor(
    string memory uri,
    address factory,
    uint256 royaltyAmount,
    address creator
  ) ERC1155(uri) NFTRoyalty(royaltyAmount, creator) {
    parentFactory = factory;
  }

  modifier onlyFactory() {
    require(
      _msgSender() == parentFactory,
      "PRIVIPodERC1155RoyaltyToken: Only Factory can call this function."
    );
    _;
  }

  /**
   * @dev Creates `amount` new tokens for `to`, of token type `id`.
   *
   * See {ERC1155-_mint}.
   *
   * Requirements:
   *
   * - tthe caller must be factory only.
   */
  function mint(
    address to,
    uint256 id,
    uint256 amount,
    bytes memory data
  ) public virtual onlyFactory {
    _mint(to, id, amount, data);
  }

  /**
   * @dev Creates `amount` new tokens for `to`, of token type `id`.
   *
   * See {ERC1155-_mint}.
   *
   * Requirements:
   *
   * - tthe caller must be factory only.
   */
  function mintBatch(
    address to,
    uint256[] memory ids,
    uint256[] memory amounts,
    bytes memory data
  ) public virtual onlyFactory {
    _mintBatch(to, ids, amounts, data);
  }

  function _beforeTokenTransfer(
    address operator,
    address from,
    address to,
    uint256[] memory ids,
    uint256[] memory amounts,
    bytes memory data
  ) internal virtual override(ERC1155) {
    super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
  }
}
