const BridgeManager = artifacts.require('BridgeManager');

module.exports = function (deployer, networks, accounts) {
	await deployer.deploy(BridgeManager);
};
