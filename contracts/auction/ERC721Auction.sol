// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "./AdminRole.sol";

/**
 * @notice Primary sale auction contract for Refinable NFTs
 */
contract ERC721Auction is Context, ReentrancyGuard, AdminRole {
    using Address for address;

    /// @notice Event emitted only on construction. To be used by indexers
    event AuctionContractDeployed();

    event PauseToggled(bool isPaused);

    event Destroy();

    event AuctionCreated(uint256 indexed tokenId);

    event AuctionStartTimeUpdated(uint256 indexed tokenId, uint256 startTime);

    event AuctionEndTimeUpdated(uint256 indexed tokenId, uint256 endTime);

    event MinBidIncrementUpdated(uint256 minBidIncrement);

    event MaxBidStackCountUpdated(uint256 maxBidStackCount);

    event BidWithdrawalLockTimeUpdated(uint256 bidWithdrawalLockTime);

    event BidPlaced(
        uint256 indexed tokenId,
        address indexed bidder,
        uint256 bidAmount
    );

    event BidWithdrawn(
        uint256 indexed tokenId,
        address indexed bidder,
        uint256 bidAmount
    );

    event BidRefunded(address indexed bidder, uint256 bidAmount);

    event AuctionResulted(
        uint256 indexed tokenId,
        address indexed winner,
        uint256 winningBidAmount
    );

    event AuctionCancelled(uint256 indexed tokenId);

    /// @notice Parameters of an auction
    struct Auction {
        address owner;
        uint256 startPrice;
        uint256 startTime;
        uint256 endTime;
        bool created;
    }

    /// @notice Information about the sender that placed a bid on an auction
    struct Bid {
        address payable bidder;
        uint256 bidAmount;
        uint256 bidTime;
    }


    /// @notice ERC721 Token ID -> Auction Parameters
    mapping(uint256 => Auction) public auctions;

    /// @notice ERC721 Token ID -> bidder info (if a bid has been received)
    mapping(uint256 => Bid[]) public bids;

    /// @notice ERC721 NFT
    IERC721 public token;

    /// @notice globally and across all auctions, the amount by which a bid has to increase
    uint256 public minBidIncrement = 100000000000000000;

    /// @notice global bid withdrawal lock time
    uint256 public bidWithdrawalLockTime = 20 minutes;

    /// @notice global limit time betwen bid time and auction end time
    uint256 public bidLimitBeforeEndTime = 5 minutes;

    /// @notice max bidders stack count
    uint256 public maxBidStackCount = 3;

    /// @notice for switching off auction creations, bids and withdrawals
    bool public isPaused;

    /// @notice service fee bps
    uint256 public serviceFeeBps = 250;

    /// @notice service fee recipient
    address public serviceFeeRecipient;

    modifier whenNotPaused() {
        require(!isPaused, "Function is currently paused");
        _;
    }

    modifier onlyCreatedAuction(uint256 _tokenId) {
        require(
            auctions[_tokenId].created == true,
            "Auction.onlyCreatedAuction: Auction does not exist"
        );
        _;
    }

    /**
     * @notice Auction Constructor
     * @param _token Token Interface
     * @param _serviceFeeRecipient service fee recipient address
     */
    constructor(
        IERC721 _token,
        address _serviceFeeRecipient
    ) {
        require(address(_token) != address(0), "Invalid NFT");

        token = _token;
        serviceFeeRecipient = _serviceFeeRecipient;

        emit AuctionContractDeployed();
    }

    /**
     * @notice Creates a new auction for a given token
     * @dev Only the owner of a token can create an auction and must have approved the contract
     * @dev End time for the auction must be in the future.
     * @param _tokenId Token ID of the token being auctioned
     * @param _startTimestamp Unix epoch in seconds for the auction start time
     * @param _endTimestamp Unix epoch in seconds for the auction end time.
     */
    function createAuction(
        uint256 _tokenId,
        uint256 _startPrice,
        uint256 _startTimestamp,
        uint256 _endTimestamp
    ) external whenNotPaused {
        // Check owner of the token is the creator and approved
        require(
            token.isApprovedForAll(token.ownerOf(_tokenId), address(this)),
            "Auction.createAuction: Owner has not approved"
        );
        require(
            token.ownerOf(_tokenId) == _msgSender(),
            "Auction.createAuction: Caller is not the owner"
        );

        _createAuction(_tokenId, _startPrice,_startTimestamp, _endTimestamp);

        emit AuctionCreated(_tokenId);
    }

    /**
     * @notice Places a new bid, out bidding the existing bidder if found and criteria is reached
     * @dev Only callable when the auction is open
     * @dev Bids from smart contracts are prohibited to prevent griefing with always reverting receiver
     * @param _tokenId Token ID of the token being auctioned
     */
    function placeBid(uint256 _tokenId)
        external
        payable
        nonReentrant
        whenNotPaused
        onlyCreatedAuction(_tokenId)
    {
        require(
            _msgSender().isContract() == false,
            "Auction.placeBid: No contracts permitted"
        );

        // Ensure auction is in flight
        require(
            _getNow() >= auctions[_tokenId].startTime && _getNow() <= auctions[_tokenId].endTime,
            "Auction.placeBid: Bidding outside of the auction window"
        );

        _placeBid(_tokenId);

        emit BidPlaced(_tokenId, _msgSender(), msg.value);
    }

    /**
     * @notice Results a finished auction
     * @dev Only admin or smart contract
     * @dev Auction can only be resulted if there has been a bidder and reserve met.
     * @dev If there have been no bids, the auction needs to be cancelled instead using `cancelAuction()`
     * @param _tokenId Token ID of the token being auctioned
     */
    function endAuction(uint256 _tokenId)
        external
        nonReentrant
        onlyCreatedAuction(_tokenId)
    {
        require(
            isAdmin(_msgSender()) || (auctions[_tokenId].owner == _msgSender()),
            "Auction.endAuction: only Admin or auction owner can result the auction"
        );
        Auction memory auction = auctions[_tokenId];

        // Check the auction real
        require(
            auction.endTime > 0,
            "Auction.endAuction: Auction does not exist"
        );

        // Check the auction has ended
        require(
            _getNow() > auction.endTime,
            "Auction.endAuction: The auction has not ended"
        );

        // Ensure this contract is approved to move the token
        require(
            token.isApprovedForAll(auction.owner, address(this)),
            "Auction.endAuction: auction not approved"
        );

        // Get info on who the highest bidder is
        Bid[] storage bidList = bids[_tokenId];

        require(bidList.length > 0, "Auction.endAuction: There is no bid");

        Bid memory highestBid = bidList[bidList.length - 1];

        _payoutAuction(auction.owner, highestBid);

        // Transfer the token to the winner
        token.safeTransferFrom(auction.owner, highestBid.bidder, _tokenId);

        // Refund bid amount to bidders who isn't the top unfortunately
        for (uint256 i = 0; i < bidList.length - 1; i++) {
            _refundBid(bidList[i].bidder, bidList[i].bidAmount);
        }

        // Clean up the highest bid
        delete bids[_tokenId];
        delete auctions[_tokenId];

        emit AuctionResulted(_tokenId, highestBid.bidder, highestBid.bidAmount);
    }

    /**
     * @notice Cancels and inflight and un-resulted auctions, returning the funds to bidders if found
     * @dev Only admin
     * @param _tokenId Token ID of the token being auctioned
     */
    function cancelAuction(uint256 _tokenId)
        external
        nonReentrant
        onlyAdmin
        onlyCreatedAuction(_tokenId)
    {
        // Check auction is real
        require(
            auctions[_tokenId].endTime > 0,
            "Auction.cancelAuction: Auction does not exist"
        );

        // refund bid amount to existing bidders
        Bid[] storage bidList = bids[_tokenId];

        require(bidList.length > 0, "Auction.cancelAuction: There is no bid");

        for (uint256 i = 0; i < bidList.length; i++) {
            _refundBid(bidList[i].bidder, bidList[i].bidAmount);
        }

        // Clear up highest bid
        delete bids[_tokenId];

        // Remove auction and top bidder
        delete auctions[_tokenId];

        emit AuctionCancelled(_tokenId);
    }

    /**
     * @notice Update the amount by which bids have to increase, across all auctions
     * @dev Only admin
     * @param _minBidIncrement New bid step in WEI
     */
    function updateMinBidIncrement(uint256 _minBidIncrement)
        external
        onlyAdmin
    {
        minBidIncrement = _minBidIncrement;
        emit MinBidIncrementUpdated(_minBidIncrement);
    }

    /**
     * @notice Update the global max bid stack count
     * @dev Only admin
     * @param _maxBidStackCount max bid stack count
     */
    function updateMaxBidStackCount(uint256 _maxBidStackCount)
        external
        onlyAdmin
    {
        maxBidStackCount = _maxBidStackCount;
        emit MaxBidStackCountUpdated(_maxBidStackCount);
    }

    /**
     * @notice Update the global bid withdrawal lockout time
     * @dev Only admin
     * @param _bidWithdrawalLockTime New bid withdrawal lock time
     */
    function updateBidWithdrawalLockTime(uint256 _bidWithdrawalLockTime)
        external
        onlyAdmin
    {
        bidWithdrawalLockTime = _bidWithdrawalLockTime;
        emit BidWithdrawalLockTimeUpdated(_bidWithdrawalLockTime);
    }

    /**
     * @notice Update the current start time for an auction
     * @dev Only admin
     * @dev Auction must exist
     * @param _tokenId Token ID of the token being auctioned
     * @param _startTime New start time (unix epoch in seconds)
     */
    function updateAuctionStartTime(uint256 _tokenId, uint256 _startTime)
        external
        onlyAdmin
        onlyCreatedAuction(_tokenId)
    {
        require(
            auctions[_tokenId].endTime > 0,
            "Auction.updateAuctionStartTime: No Auction exists"
        );

        auctions[_tokenId].startTime = _startTime;
        emit AuctionStartTimeUpdated(_tokenId, _startTime);
    }

    /**
     * @notice Update the current end time for an auction
     * @dev Only admin
     * @dev Auction must exist
     * @param _tokenId Token ID of the token being auctioned
     * @param _endTimestamp New end time (unix epoch in seconds)
     */
    function updateAuctionEndTime(uint256 _tokenId, uint256 _endTimestamp)
        external
        onlyAdmin
        onlyCreatedAuction(_tokenId)
    {
        require(
            auctions[_tokenId].endTime > 0,
            "Auction.updateAuctionEndTime: No Auction exists"
        );
        require(
            auctions[_tokenId].startTime < _endTimestamp,
            "Auction.updateAuctionEndTime: End time must be greater than start"
        );
        require(
            _endTimestamp > _getNow(),
            "Auction.updateAuctionEndTime: End time passed. Nobody can bid"
        );

        _updateAuctionEndTime(_tokenId, _endTimestamp);
    }

    /**
     * @notice Method for getting all info about the auction
     * @param _tokenId Token ID of the token being auctioned
     */
    function getAuction(uint256 _tokenId)
        external
        view
        onlyCreatedAuction(_tokenId)
        returns (Auction memory)
    {
        return auctions[_tokenId];
    }

    /**
     * @notice Method for getting all info about the bids
     * @param _tokenId Token ID of the token being auctioned
     */
    function getBidList(uint256 _tokenId) public view returns (Bid[] memory) {
        return bids[_tokenId];
    }

    function _getNow() internal view virtual returns (uint256) {
        return block.timestamp;
    }

    /**
     * @notice Private method doing the heavy lifting of creating an auction
     * @param _tokenId Token ID of the token being auctioned
     * @param _startTimestamp Unix epoch in seconds for the auction start time
     * @param _endTimestamp Unix epoch in seconds for the auction end time.
     */
    function _createAuction(
        uint256 _tokenId,
        uint256 _startPrice,
        uint256 _startTimestamp,
        uint256 _endTimestamp
    ) private {
        // Check the auction alreay created
        require(
            auctions[_tokenId].created == false,
            "Auction.createAuction: Auction has been already created"
        );
        // Check end time not before start time and that end is in the future
        require(
            _endTimestamp > _startTimestamp,
            "Auction.createAuction: End time must be greater than start"
        );
        require(
            _endTimestamp > _getNow(),
            "Auction.createAuction: End time passed. Nobody can bid"
        );

        // Setup the auction
        auctions[_tokenId] = Auction({
            owner: _msgSender(),
            startPrice: _startPrice,
            startTime: _startTimestamp,
            endTime: _endTimestamp,
            created: true
        });
    }

    /**
     * @notice Used for sending back escrowed funds from a previous bid
     * @param _bidder Address of the last highest bidder
     * @param _bidAmount Ether amount in WEI that the bidder sent when placing their bid
     */
    function _refundBid(address payable _bidder, uint256 _bidAmount) private {
        // refund previous best (if bid exists)
        (bool successRefund, ) = _bidder.call{value: _bidAmount}("");
        require(
            successRefund,
            "Auction._refundHighestBidder: failed to refund previous bidder"
        );
        emit BidRefunded(_bidder, _bidAmount);
    }

    /**
     * @notice Used for placing bid with token id
     * @param _tokenId id of the token
     */
    function _placeBid(uint256 _tokenId) private {
        uint256 bidAmount = msg.value;

        // Ensure bid adheres to outbid increment and threshold
        Bid[] storage bidList = bids[_tokenId];

        if (bidList.length != 0) {
            Bid memory prevHighestBid = bidList[bidList.length - 1];
            uint256 minBidRequired =
                prevHighestBid.bidAmount + minBidIncrement;
            require(
                bidAmount >= minBidRequired,
                "Auction.placeBid: Failed to outbid highest bidder"
            );
        } else {
            require(
                bidAmount >= auctions[_tokenId].startPrice,
                "Auction.placeBid: Bid amount should be higher than start price"
            );
        }

        // assign top bidder and bid time
        Bid memory newHighestBid;
        newHighestBid.bidder = payable(_msgSender());
        newHighestBid.bidAmount = bidAmount;
        newHighestBid.bidTime = _getNow();
        bidList.push(newHighestBid);

        //Refund old bid if bidlist overflows thans max bid stack count
        if (bidList.length > maxBidStackCount) {
            Bid memory oldBid = bidList[0];
            if (oldBid.bidder != address(0)) {
                _refundBid(oldBid.bidder, oldBid.bidAmount);
            }

            for (uint256 i = 0; i < bidList.length - 1; i++) {
                bidList[i] = bidList[i + 1];
            }
            bidList.pop();
        }

        //Increase auction end time if bid time is more than 5 mins before end time
        if(auctions[_tokenId].endTime <= newHighestBid.bidTime + bidLimitBeforeEndTime) {
            _updateAuctionEndTime(_tokenId, auctions[_tokenId].endTime + bidLimitBeforeEndTime);
        }
    }

    /**
     * @notice Used for pay out funds to token owner and service fee recipient
     * @param _owner owner of the auction
     * @param _highestBid the highest Bid object
     */
    function _payoutAuction(address _owner, Bid memory _highestBid) private {
        uint256 winningBidAmount = _highestBid.bidAmount;

        // Work out platform fee from above reserve amount
        uint256 serviceFee = winningBidAmount * serviceFeeBps / 10000;

        // Send platform fee
        (bool platformTransferSuccess, ) =
            serviceFeeRecipient.call{value: serviceFee}("");
        require(
            platformTransferSuccess,
            "Auction.payoutAuction: Failed to send platform fee"
        );

        // Send remaining to designer
        (bool ownerTransferSuccess, ) =
            _owner.call{
                value: winningBidAmount - serviceFee
            }("");
        require(
            ownerTransferSuccess,
            "Auction.payoutAuction: Failed to send winning bid to owner"
        );
    }

    /**
     * @notice Used for update auction end time
     * @param _tokenId Id of the token
     * @param _endTimestamp timestamp of end time
     */
    function _updateAuctionEndTime(uint256 _tokenId, uint256 _endTimestamp) private {
        auctions[_tokenId].endTime = _endTimestamp;
        emit AuctionEndTimeUpdated(_tokenId, _endTimestamp);
    }

    /**
     * @notice Toggling the pause of the contract
     * @dev Only admin
    */
    function toggleIsPaused() external onlyAdmin {
        isPaused = !isPaused;
        emit PauseToggled(isPaused);
    }

    /**
     * @notice Destroy the smart contract
     * @dev Only admin
     */
    function destroy() external onlyAdmin {
        selfdestruct(payable(serviceFeeRecipient));
        emit Destroy();
    }
}

