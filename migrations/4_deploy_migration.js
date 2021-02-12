const BridgeManager = artifacts.require('BridgeManager');
const PRIVIPodERC721Factory = artifacts.require('PRIVIPodERC721Factory');

module.exports = function (deployer, networks, accounts) {
	const bridgeManagerContract = await BridgeManager.deployed();
	await deployer.deploy(PRIVIPodERC721Factory, bridgeManagerContract.address);	
};
