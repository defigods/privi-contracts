const PRIVIPodERC20Factory = artifacts.require("PRIVIPodERC20Factory");

module.exports = async function (deployer, networks, accounts) {
	const priviPodERC20FactoryContract = await deployer.deploy(PRIVIPodERC20Factory);
};
