const BridgeManager = artifacts.require('BridgeManager')
const PRIVIPodERC1155RoyaltyFactory = artifacts.require('PRIVIPodERC1155RoyaltyFactory')

module.exports = async function(deployer, networks, accounts) {
  const bridgeManagerContract = await BridgeManager.deployed()
  await deployer.deploy(PRIVIPodERC1155RoyaltyFactory, bridgeManagerContract.address)
}
