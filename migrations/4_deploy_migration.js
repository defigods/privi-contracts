const BridgeManager = artifacts.require('BridgeManager');
const PRIVIPodERC721Factory = artifacts.require('PRIVIPodERC721Factory');
const PRIVIPodERC1155Factory = artifacts.require('PRIVIPodERC1155Factory');

module.exports = async function (deployer, networks, accounts) {
	const bridgeManagerContract = await BridgeManager.deployed();
	await deployer.deploy(PRIVIPodERC721Factory, bridgeManagerContract.address);	
	await deployer.deploy(PRIVIPodERC1155Factory, bridgeManagerContract.address);	
};
