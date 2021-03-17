#!/bin/bash

echo "flatening BridgeManager.sol"
truffle-flattener contracts/BridgeManager.sol > flatted/BridgeManager.sol

echo "flatening SwapManager.sol"
truffle-flattener contracts/SwapManager.sol > flatted/SwapManager.sol

echo "flatening PRIVIPodERC20Factory.sol"
truffle-flattener contracts/PRIVIPodERC20Factory.sol > flatted/PRIVIPodERC20Factory.sol

echo "flatening PRIVIPodERC721Factory.sol"
truffle-flattener contracts/PRIVIPodERC721Factory.sol > flatted/PRIVIPodERC721Factory.sol

echo "flatening PRIVIPodERC721Token.sol"
truffle-flattener contracts/token/PRIVIPodERC721Token.sol > flatted/PRIVIPodERC721Token.sol

echo "flatening MultiCreatorNftManager.sol"
truffle-flattener contracts/deployable_managers/MultiCreatorNftManager.sol > flatted/MultiCreatorNftManager.sol

echo "flatening PRIVIPodERC721RoyaltyFactory.sol"
truffle-flattener contracts/PRIVIPodERC721RoyaltyFactory.sol > flatted/PRIVIPodERC721RoyaltyFactory.sol
