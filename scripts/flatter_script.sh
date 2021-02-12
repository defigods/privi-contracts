#!/bin/bash

echo "flatening BridgeManager.sol"
truffle-flattener contracts/BridgeManager.sol > flatted/BridgeManager.sol

echo "flatening SwapManager.sol"
truffle-flattener contracts/SwapManager.sol > flatted/SwapManager.sol

echo "flatening PRIVIPodERC20Factory.sol"
truffle-flattener contracts/PRIVIPodERC20Factory.sol > flatted/PRIVIPodERC20Factory.sol

echo "flatening PRIVIPodERC721Factory.sol"
truffle-flattener contracts/PRIVIPodERC721Factory.sol > flatted/PRIVIPodERC721Factory.sol
