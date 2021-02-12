const SwapManager = artifacts.require("SwapManager");
const FakePrivi = artifacts.require("FakePrivi");

const FakeBAL = artifacts.require("FakeBAL");
const FakeBAT = artifacts.require("FakeBAT");
const FakeCOMP = artifacts.require("FakeCOMP");
const FakeDAI = artifacts.require("FakeDAI");
const FakeLINK = artifacts.require("FakeLINK");

module.exports = async function (deployer, networks, accounts) {
	const swapManagerContract = await SwapManager.deployed();
	const swapManagerAddress = swapManagerContract.address;
	await deployer.deploy(FakePrivi, swapManagerAddress);
	await deployer.deploy(FakeBAL, swapManagerAddress);
	await deployer.deploy(FakeBAT, swapManagerAddress);
	await deployer.deploy(FakeCOMP, swapManagerAddress);
	await deployer.deploy(FakeDAI, swapManagerAddress);
	await deployer.deploy(FakeLINK, swapManagerAddress);
};
