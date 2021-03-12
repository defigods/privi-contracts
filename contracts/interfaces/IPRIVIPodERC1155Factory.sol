// SPDX-License-Identifier: MIT

pragma solidity ^0.7.6;

interface IPRIVIPodERC1155Factory {

    event PodCreated(string indexed uri, address podAddress);

    function getPodAddressByUri(string calldata uri) external view returns(address podAddress);

    /**
     *@dev caller create a new pod.
     *
     * Requirements:
     *
     * - the caller must MODERATOR_ROLE to perform this action.
     * - pod should not exist before.
     */
    function createPod(string calldata uri) external returns (address podAddress);
    
    /**
     * @dev Moderator will mint the amount of pod token for the investor's account
     *
     * Requirements:
     *
     * - the caller must MODERATOR_ROLE to perform this action.
     */
    function podMint(string calldata uri, address account, uint256 tokenId,  uint256 amount, bytes calldata data) external;

    function podMintBatch(string calldata uri, address account, uint256[] memory  tokenIds,  uint256[] memory  amounts, bytes calldata data) external;
    
}