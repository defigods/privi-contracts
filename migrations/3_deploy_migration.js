const BridgeManager = artifacts.require('BridgeManager')
const PRIVIPodERC20Factory = artifacts.require('PRIVIPodERC20Factory')
const PRIVIPodERC721RoyaltyFactory = artifacts.require('PRIVIPodERC721RoyaltyFactory')

module.exports = async function(deployer, networks, accounts) {
  const bridgeManagerContract = await BridgeManager.deployed()
  await deployer.deploy(PRIVIPodERC20Factory, bridgeManagerContract.address)
  await deployer.deploy(PRIVIPodERC721RoyaltyFactory, bridgeManagerContract.address)
}
