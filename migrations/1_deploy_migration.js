const BridgeManager = artifacts.require('BridgeManager')

module.exports = async function(deployer, networks, accounts) {
  await deployer.deploy(BridgeManager)
}
