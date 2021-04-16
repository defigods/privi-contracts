// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

contract AtomicSwapERC721 is IERC721Receiver {
    struct Swap {
        uint256 timelock;
        uint256 tokenId;
        address proposer;
        address contractAddress;
        address withdrawer;
        bytes32 secretLock;
        bytes32 secretKey;
    }

    /**
     * @dev Swap States
     * EMPTY - Default Value
     * OPEN - Created Proposal
     * CLOSED - Claimed Funds
     * EXPIRED - Refund Funds
     */
    enum States {EMPTY, OPEN, CLOSED, EXPIRED}

    mapping(bytes32 => Swap) private swaps;
    mapping(bytes32 => States) private swapStates;

    event OpenProposal(
        bytes32 _swapID,
        address _withdrawer,
        bytes32 _secretLock
    );
    event ExpireProposal(bytes32 _swapID);
    event CloseProposal(bytes32 _swapID, bytes32 _secretKey);

    modifier onlyEmptySwaps(bytes32 _swapID) {
        require(
            swapStates[_swapID] == States.EMPTY,
            "AtomicSwapERC721: Swap it not empty"
        );
        _;
    }

    modifier onlyOpenSwaps(bytes32 _swapID) {
        require(
            swapStates[_swapID] == States.OPEN,
            "AtomicSwapERC721: Swap is not opened"
        );
        _;
    }

    modifier onlyClosedSwaps(bytes32 _swapID) {
        require(
            swapStates[_swapID] == States.CLOSED,
            "AtomicSwapERC721: Swap is not closed"
        );
        _;
    }

    modifier onlyExpirableSwaps(bytes32 _swapID) {
        require(
            swaps[_swapID].timelock <= _getNow(),
            "AtomicSwapERC721: Swap is not expired"
        );
        _;
    }

    modifier onlyWithSecretKey(bytes32 _swapID, bytes32 _secretKey) {
        // TODO: Require _secretKey length to conform to the spec
        require(
            swaps[_swapID].secretLock == keccak256(abi.encodePacked(_secretKey, swaps[_swapID].withdrawer)),
            "AtomicSwapERC721: Invalid secret key"
        );
        _;
    }

    modifier onlyWithdrawer(bytes32 _swapID) {
        require(
            msg.sender == swaps[_swapID].withdrawer,
            "AtomicSwapERC721: Caller is not the withdrawer"
        );
        _;
    }

    modifier onlyProposer(bytes32 _swapID) {
        require(
            msg.sender == swaps[_swapID].proposer,
            "AtomicSwapERC721: Caller is not the proposer"
        );
        _;
    }

    function createProposal(
        bytes32 _swapID,
        uint256 _tokenId,
        address _contractAddress,
        address _withdrawer,
        bytes32 _secretLock,
        uint256 _timelock
    ) external onlyEmptySwaps(_swapID) {
        // Transfer token from proposer to this contract.
        IERC721 contractInstance = IERC721(_contractAddress);

        // Check owner of the token is the caller and approved
        require(
            contractInstance.ownerOf(_tokenId) == msg.sender && contractInstance.isApprovedForAll(msg.sender, address(this)),
            "Auction.createAuction: Not owner and or contract not approved"
        );

        contractInstance.safeTransferFrom(msg.sender, address(this), _tokenId);

        // Store the details of the swap.
        Swap memory swap =
        Swap({
            timelock: _timelock,
            tokenId: _tokenId,
            proposer: msg.sender,
            contractAddress: _contractAddress,
            withdrawer: _withdrawer,
            secretLock: _secretLock,
            secretKey: 0
        });
        swaps[_swapID] = swap;
        swapStates[_swapID] = States.OPEN;
        emit OpenProposal(_swapID, _withdrawer, _secretLock);
    }

    function claimFunds(bytes32 _swapID, bytes32 _secretKey)
        public
        onlyOpenSwaps(_swapID)
        onlyWithSecretKey(_swapID, _secretKey)
        onlyWithdrawer(_swapID)
    {
        // Close the swap.
        Swap memory swap = swaps[_swapID];
        swaps[_swapID].secretKey = _secretKey;
        swapStates[_swapID] = States.CLOSED;

        // Transfer the funds from this contract to the withdrawer.
        IERC721 contractInstance = IERC721(swap.contractAddress);
        contractInstance.safeTransferFrom(address(this), swap.withdrawer, swap.tokenId);

        emit CloseProposal(_swapID, _secretKey);
    }

    function refundFunds(bytes32 _swapID)
        public
        onlyOpenSwaps(_swapID)
        onlyExpirableSwaps(_swapID)
        onlyProposer(_swapID)
    {
        // Expire the swap.
        Swap memory swap = swaps[_swapID];
        swapStates[_swapID] = States.EXPIRED;

        // Transfer the token from this contract back to the proposer.
        IERC721 contractInstance = IERC721(swap.contractAddress);
        contractInstance.safeTransferFrom(address(this), swap.proposer, swap.tokenId);

        emit ExpireProposal(_swapID);
    }

    function getSwapInfo(bytes32 _swapID)
        public
        view
        returns (
        uint256 timelock,
        uint256 tokenId,
        address contractAddress,
        address withdrawer,
        bytes32 secretLock
        )
    {
        Swap memory swap = swaps[_swapID];
        return (
        swap.timelock,
        swap.tokenId,
        swap.contractAddress,
        swap.withdrawer,
        swap.secretLock
        );
    }

    function getSecretKey(bytes32 _swapID)
        public
        view
        onlyClosedSwaps(_swapID)
        returns (bytes32 secretKey)
    {
        Swap memory swap = swaps[_swapID];
        return swap.secretKey;
    }

    function _getNow() internal view virtual returns (uint256) {
        return block.timestamp;
    }

    function onERC721Received(address, address, uint256, bytes memory) public virtual override returns (bytes4) {
        return this.onERC721Received.selector;
    }
}
