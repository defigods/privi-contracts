// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IPRIVIPodERC721RoyaltyFactory {
    
    event PodCreated(string indexed podId, string podTokenName, string podTokenSymbol);

    function getTotalTokenCreated() external view returns(uint256 totalPods);

    function getPodAddressById(string calldata podId) external view returns(address podAddress);

    function getPodAddressBySymbol(string calldata tokenSymbol) external view returns(address podAddress);
    
    /**
     *@dev Create pods of one single creator
     *
     * Requirements:
     *
     * - pod id and pod symbol should not exist before.
     */
    function createPod(string calldata podId, string calldata podTokenName, string calldata podTokenSymbol, string calldata baseURI, uint256 royaltyAmount, address creator) external returns (address podAddress);

    /**
     *@dev Create pods
     *
     * Requirements:
     *
     * - pod id and symbol should not exist before.
     */
    function createMultiCreatorPod(string calldata podId, string calldata podTokenName, string calldata podTokenSymbol, string calldata baseURI, uint256 royaltyAmount, uint256[] memory royaltyShares, address[] memory creators) external returns (address podAddress);
    
    /**
     * @dev Moderator will mint the amount of pod token for the investor's account
     *
     * Requirements:
     *
     * - the caller must MODERATOR_ROLE to perform this action.
     */
    function mintPodTokenById(string calldata podId, address account) external;

    /**
     * @dev Moderator will mint the amount of pod token for the investor's account
     *
     * Requirements:
     *
     * - the caller must MODERATOR_ROLE to perform this action.
     */
    function mintPodTokenBySymbol(string calldata tokenSymbol, address account) external;
    
}