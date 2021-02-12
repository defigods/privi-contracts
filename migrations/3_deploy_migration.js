const BridgeManager = artifacts.require('BridgeManager');
const PRIVIPodERC20Factory = artifacts.require('PRIVIPodERC20Factory');

module.exports = function (deployer, networks, accounts) {
	const bridgeManagerContract = await BridgeManager.deployed();
	await deployer.deploy(PRIVIPodERC20Factory, bridgeManagerContract.address);	
};
