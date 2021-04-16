// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract AtomicSwapERC20 {
    struct Swap {
        uint256 timelock;
        uint256 value;
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
            "AtomicSwapERC20: Swap it not empty"
        );
        _;
    }

    modifier onlyOpenSwaps(bytes32 _swapID) {
        require(
            swapStates[_swapID] == States.OPEN,
            "AtomicSwapERC20: Swap is not opened"
        );
        _;
    }

    modifier onlyClosedSwaps(bytes32 _swapID) {
        require(
            swapStates[_swapID] == States.CLOSED,
            "AtomicSwapERC20: Swap is not closed"
        );
        _;
    }

    modifier onlyExpirableSwaps(bytes32 _swapID) {
        require(
            swaps[_swapID].timelock <= _getNow(),
            "AtomicSwapERC20: Swap is not expired"
        );
        _;
    }

    modifier onlyWithSecretKey(bytes32 _swapID, bytes32 _secretKey) {
        // TODO: Require _secretKey length to conform to the spec
        require(
            swaps[_swapID].secretLock == keccak256(abi.encodePacked(_secretKey, swaps[_swapID].withdrawer)),
            "AtomicSwapERC20: Invalid secret key"
        );
        _;
    }

    modifier onlyWithdrawer(bytes32 _swapID) {
        require(
            msg.sender == swaps[_swapID].withdrawer,
            "AtomicSwapERC20: Caller is not the withdrawer"
        );
        _;
    }

    modifier onlyProposer(bytes32 _swapID) {
        require(
            msg.sender == swaps[_swapID].proposer,
            "AtomicSwapERC20: Caller is not the proposer"
        );
        _;
    }

    function createProposal(
        bytes32 _swapID,
        uint256 _value,
        address _contractAddress,
        address _withdrawer,
        bytes32 _secretLock,
        uint256 _timelock
    ) public onlyEmptySwaps(_swapID) {
        // Transfer value from the token proposer to this contract.
        IERC20 contractInstance = IERC20(_contractAddress);
        require(
            _value <= contractInstance.allowance(msg.sender, address(this)),
            "AtomicSwapERC20.createProposal: Caller has not enough balance"
        );
        require(
            contractInstance.transferFrom(msg.sender, address(this), _value),
            "AtomicSwapERC20.createProposal: Transaction failed"
        );

        // Store the details of the swap.
        Swap memory swap =
        Swap({
            timelock: _timelock,
            value: _value,
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
        IERC20 contractInstance = IERC20(swap.contractAddress);
        require(
            contractInstance.transfer(swap.withdrawer, swap.value),
            "AtomicSwapERC20.claimFunds: Transaction failed"
        );

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
        IERC20 contractInstance = IERC20(swap.contractAddress);
        require(
            contractInstance.transfer(swap.proposer, swap.value),
            "AtomicSwapERC20.refundFunds: Transaction failed"
        );

        emit ExpireProposal(_swapID);
    }

    function getSwapInfo(bytes32 _swapID)
        public
        view
        returns (
        uint256 timelock,
        uint256 value,
        address contractAddress,
        address withdrawer,
        bytes32 secretLock
        )
    {
        Swap memory swap = swaps[_swapID];
        return (
        swap.timelock,
        swap.value,
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
}

