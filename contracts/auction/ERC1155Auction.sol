// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "./AdminRole.sol";

/**
 * @notice Primary sale auction contract for Refinable NFTs
 */
contract ERC1155Auction is Context, ReentrancyGuard, AdminRole {
    using SafeMath for uint256;
    using Address for address;

    /// @notice Event emitted only on construction. To be used by indexers
    event AuctionContractDeployed();

    event PauseToggled(bool isPaused);

    event Destroy();

    event AuctionCreated(uint256 indexed tokenId, address owner);

    event AuctionEndTimeUpdated(uint256 indexed tokenId, address owner, uint256 endTime);

    event AuctionStartTimeUpdated(uint256 indexed tokenId, address owner, uint256 startTime);

    event MinBidIncrementUpdated(uint256 minBidIncrement);

    event MaxBidStackCountUpdated(uint256 maxBidStackCount);

    event BidWithdrawalLockTimeUpdated(uint256 bidWithdrawalLockTime);

    event BidPlaced(
        uint256 indexed tokenId,
        address owner,
        address indexed bidder,
        uint256 bidAmount
    );

    event BidWithdrawn(
        uint256 indexed tokenId,
        address owner,
        address indexed bidder,
        uint256 bidAmount
    );

    event BidRefunded(address indexed bidder, uint256 bidAmount);

    event AuctionResulted(
        uint256 indexed tokenId,
        address owner,
        address indexed winner,
        uint256 winningBidAmount
    );

    event AuctionCancelled(uint256 indexed tokenId, address owner);

    /// @notice Parameters of an auction
    struct Auction {
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

    /// @notice ERC1155 Token ID -> Owner -> Auction Parameters
    mapping(uint256 => mapping(address => Auction)) public auctions;

    /// @notice ERC1155 Token ID -> bidder info (if a bid has been received)
    mapping(uint256 => mapping(address => Bid[])) public bids;

    /// @notice ERC1155 NFT
    IERC1155 public token;

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

    modifier onlyCreatedAuction(uint256 _tokenId, address _owner) {
        require(
            auctions[_tokenId][_owner].created == true,
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
        IERC1155 _token,
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
        // Check owner has token and approved
        require(
            token.balanceOf(_msgSender(), _tokenId) > 0,
            "Auction.createAuction: Caller does not have the token"
        );
        require(
            token.isApprovedForAll(_msgSender(), address(this)),
            "Auction.createAuction: Owner has not approved"
        );

        _createAuction(_tokenId, _startPrice, _startTimestamp, _endTimestamp);

        emit AuctionCreated(_tokenId, _msgSender());
    }

    /**
     * @notice Places a new bid, out bidding the existing bidder if found and criteria is reached
     * @dev Only callable when the auction is open
     * @dev Bids from smart contracts are prohibited to prevent griefing with always reverting receiver
     * @param _tokenId Token ID of the token being auctioned
     * @param _owner owner of the token being auctioned
     */
    function placeBid(uint256 _tokenId, address _owner)
        external
        payable
        nonReentrant
        whenNotPaused
        onlyCreatedAuction(_tokenId, _owner)
    {
        require(
            _msgSender().isContract() == false,
            "Auction.placeBid: No contracts permitted"
        );

        // Ensure auction is in flight
        require(
            _getNow() >= auctions[_tokenId][_owner].startTime && _getNow() <= auctions[_tokenId][_owner].endTime,
            "Auction.placeBid: Bidding outside of the auction window"
        );

        _placeBid(_tokenId, _owner);

        emit BidPlaced(_tokenId, _owner, _msgSender(), msg.value);
    }

    /**
     * @notice Results a finished auction
     * @dev Only admin or smart contract
     * @dev Auction can only be resulted if there has been a bidder and reserve met.
     * @dev If there have been no bids, the auction needs to be cancelled instead using `cancelAuction()`
     * @param _tokenId Token ID of the token being auctioned
     * @param _owner Owner of the token being auctioned
     */
    function endAuction(uint256 _tokenId, address _owner)
        external
        nonReentrant
        onlyCreatedAuction(_tokenId, _owner)
    {
        require(
            isAdmin(_msgSender()) || _owner == _msgSender(),
            "Auction.endAuction: only Admin can result the auction"
        );

        Auction memory auction = auctions[_tokenId][_owner];

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
            token.isApprovedForAll(_owner, address(this)),
            "Auction.endAuction: auction not approved"
        );

        // Get info on who the highest bidder is
        Bid[] storage bidList = bids[_tokenId][_owner];

        require(bidList.length > 0, "Auction.endAuction: There is no bid");

        Bid memory highestBid = bidList[bidList.length - 1];

        _payoutAuction(_owner, highestBid);

        // Transfer the token to the winner
        token.safeTransferFrom(_owner, highestBid.bidder, _tokenId, 1, "");

        // Refund bid amount to bidders who isn't the top unfortunately
        for (uint256 i = 0; i < bidList.length - 1; i++) {
            _refundBid(bidList[i].bidder, bidList[i].bidAmount);
        }

        // Clean up the highest bid
        delete bids[_tokenId][_owner];
        delete auctions[_tokenId][_owner];

        emit AuctionResulted(_tokenId, _owner, highestBid.bidder, highestBid.bidAmount);
    }

    /**
     * @notice Cancels and inflight and un-resulted auctions, returning the funds to bidders if found
     * @dev Only admin
     * @param _tokenId Token ID of the token being auctioned
     * @param _owner Owner of the token being auctioned
     */
    function cancelAuction(uint256 _tokenId, address _owner)
        external
        nonReentrant
        onlyAdmin
        onlyCreatedAuction(_tokenId, _owner)
    {
        // Check auction is real
        require(
            auctions[_tokenId][_owner].endTime > 0,
            "Auction.cancelAuction: Auction does not exist"
        );

        // refund bid amount to existing bidders
        Bid[] storage bidList = bids[_tokenId][_owner];

        require(bidList.length > 0, "Auction.cancelAuction: There is no bid");

        for (uint256 i = 0; i < bidList.length; i++) {
            _refundBid(bidList[i].bidder, bidList[i].bidAmount);
        }

        // Clear up highest bid
        delete bids[_tokenId][_owner];

        // Remove auction and top bidder
        delete auctions[_tokenId][_owner];

        emit AuctionCancelled(_tokenId, _owner);
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
     * @param _owner Owner of the token being auctioned
     * @param _startTime New start time (unix epoch in seconds)
     */
    function updateAuctionStartTime(uint256 _tokenId, address _owner, uint256 _startTime)
        external
        onlyAdmin
        onlyCreatedAuction(_tokenId, _owner)
    {
        require(
            auctions[_tokenId][_owner].endTime > 0,
            "Auction.updateAuctionStartTime: No Auction exists"
        );

        auctions[_tokenId][_owner].startTime = _startTime;
        emit AuctionStartTimeUpdated(_tokenId, _owner, _startTime);
    }

    /**
     * @notice Update the current end time for an auction
     * @dev Only admin
     * @dev Auction must exist
     * @param _tokenId Token ID of the token being auctioned
     * @param _owner Owner of the token being auctioned
     * @param _endTimestamp New end time (unix epoch in seconds)
     */
    function updateAuctionEndTime(uint256 _tokenId, address _owner, uint256 _endTimestamp)
        external
        onlyAdmin
        onlyCreatedAuction(_tokenId, _owner)
    {
        require(
            auctions[_tokenId][_owner].endTime > 0,
            "Auction.updateAuctionEndTime: No Auction exists"
        );
        require(
            auctions[_tokenId][_owner].startTime < _endTimestamp,
            "Auction.updateAuctionEndTime: End time must be greater than start"
        );
        require(
            _endTimestamp > _getNow(),
            "Auction.updateAuctionEndTime: End time passed. Nobody can bid"
        );

        _updateAuctionEndTime(_tokenId, _owner, _endTimestamp);
    }

    /**
     * @notice Method for getting all info about the auction
     * @param _tokenId Token ID of the token being auctioned
     * @param _owner Owner of the token being auctioned
     */
    function getAuction(uint256 _tokenId, address _owner)
        external
        view
        onlyCreatedAuction(_tokenId, _owner)
        returns (Auction memory)
    {
        return auctions[_tokenId][_owner];
    }

    /**
     * @notice Method for getting all info about the bids
     * @param _tokenId Token ID of the token being auctioned
     * @param _owner Owner of the token being auctioned 
     */
    function getBidList(uint256 _tokenId, address _owner) public view returns (Bid[] memory) {
        return bids[_tokenId][_owner];
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
            auctions[_tokenId][_msgSender()].created == false,
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
        auctions[_tokenId][_msgSender()] = Auction({
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
     * @param _owner owner of the token 
     */
    function _placeBid(uint256 _tokenId, address _owner) private {
        uint256 bidAmount = msg.value;

        // Ensure bid adheres to outbid increment and threshold
        Bid[] storage bidList = bids[_tokenId][_owner];

        if (bidList.length != 0) {
            Bid memory prevHighestBid = bidList[bidList.length - 1];
            uint256 minBidRequired =
                prevHighestBid.bidAmount.add(minBidIncrement);
            require(
                bidAmount >= minBidRequired,
                "Auction.placeBid: Failed to outbid highest bidder"
            );
        } else {
            require(
                bidAmount >= auctions[_tokenId][_owner].startPrice,
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
        if(auctions[_tokenId][_owner].endTime <= newHighestBid.bidTime.add(bidLimitBeforeEndTime)) {
            _updateAuctionEndTime(_tokenId, _owner, auctions[_tokenId][_owner].endTime.add(bidLimitBeforeEndTime));
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
        uint256 serviceFee = winningBidAmount.mul(serviceFeeBps).div(10000);

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
                value: winningBidAmount.sub(serviceFee)
            }("");
        require(
            ownerTransferSuccess,
            "Auction.payoutAuction: Failed to send winning bid to owner"
        );
    }

    /**
     * @notice Used for update auction end time
     * @param _tokenId Id of the token
     * @param _owner Owner of the token
     * @param _endTimestamp timestamp of end time
     */
    function _updateAuctionEndTime(uint256 _tokenId, address _owner, uint256 _endTimestamp) private {
        auctions[_tokenId][_owner].endTime = _endTimestamp;
        emit AuctionEndTimeUpdated(_tokenId, _owner, _endTimestamp);
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

