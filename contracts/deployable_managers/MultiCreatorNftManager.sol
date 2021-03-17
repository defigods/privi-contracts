pragma solidity >=0.7.6;

// SPDX-License-Identifier: MIT

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @notice this contract under heavy development and it is not ready for production.
 */
contract MultiCreatorNftManager {
  using SafeMath for uint256;
  using Counters for Counters.Counter;

  address[] public creators;
  uint256[] public shares;
  Counters.Counter public recieveCounter;
  mapping(uint256 => uint256) public recievedPayments;
  mapping(address => uint256) public lastPaid;

  constructor(address[] memory _creators, uint256[] memory _shares) {
    require(
      _creators.length == _shares.length,
      "MultiCreatorNftManager: Creators and Shares are not of same length."
    );
    creators = _creators;
    shares = _shares;
  }

  /**
   * @dev incriment counter for each deposite
   */
  receive() external payable {
    recievedPayments[recieveCounter.current()] = msg.value;
    recieveCounter.increment();
  }

  /**
   * @dev calculate current un-withdrawed creator share
   */
  function getSharesTotal(uint256 _creatorIndex)
    public
    view
    returns (uint256 shareTotal)
  {
    for (
      uint256 i = lastPaid[creators[_creatorIndex]];
      i <= recieveCounter.current();
      i++
    ) {
      shareTotal =
        shareTotal.add(
          (
            shares[_creatorIndex]
            .mul(recievedPayments[i])
          )
          .div(100)
        );
        
    }
  }

  /**
   * @dev withdrawed creator share
   */
  function withdraw(uint256 _creatorIndex) external {
    require(
      msg.sender == creators[_creatorIndex],
      "MultiCreatorNftManager: You are not one of the creators."
    );
    uint256 shareTotal = getSharesTotal(_creatorIndex);
    lastPaid[msg.sender] = recieveCounter.current();
    payable(msg.sender).transfer(shareTotal);
  }

  /**
   * @dev get contract balance
   */
  function getContractBalance() external view returns (uint256 balance) {
    balance = address(this).balance;
  }
}
