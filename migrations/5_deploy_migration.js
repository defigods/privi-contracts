const BridgeManager = artifacts.require('BridgeManager')
const PRIVIPodERC20Factory = artifacts.require('PRIVIPodERC20Factory')
const PRIVIPodERC721Factory = artifacts.require('PRIVIPodERC721Factory')
const PRIVIPodERC1155Factory = artifacts.require('PRIVIPodERC1155Factory')
const SwapManager = artifacts.require('SwapManager')

module.exports = async function(deployer, networks, accounts) {
  const bridgeManagerContract = await BridgeManager.deployed()
  const pRIVIPodERC20FactoryContract = await PRIVIPodERC20Factory.deployed()
  const pRIVIPodERC721FactoryContract = await PRIVIPodERC721Factory.deployed()
  const pRIVIPodERC1155FactoryContract = await PRIVIPodERC1155Factory.deployed()

  await deployer.deploy(
    SwapManager,
    bridgeManagerContract.address,
    pRIVIPodERC20FactoryContract.address,
    pRIVIPodERC721FactoryContract.address,
    pRIVIPodERC1155FactoryContract.address
  )
}
