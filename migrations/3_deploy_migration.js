const SwapManager = artifacts.require("SwapManager");
const FakePrivi = artifacts.require("FakePrivi");

const FakeBAL = artifacts.require("FakeBAL");
const FakeBAT = artifacts.require("FakeBAT");
const FakeCOMP = artifacts.require("FakeCOMP");
const FakeDAI = artifacts.require("FakeDAI");
const FakeLINK = artifacts.require("FakeLINK");
const FakeMKR = artifacts.require("FakeMKR");
const FakeUNI = artifacts.require("FakeUNI");
const FakeUSDT = artifacts.require("FakeUSDT");
const FakeWBTC = artifacts.require("FakeWBTC");
const FakeWETH = artifacts.require("FakeWETH");
const FakeYFI = artifacts.require("FakeYFI");

module.exports = async function (deployer, networks, accounts) {
	const swapManagerContract = await SwapManager.deployed();
	const swapManagerAddress = swapManagerContract.address;
	const fakeFakeMKRContract = await deployer.deploy(FakeMKR, swapManagerAddress);
	const fakeFakeUNIContract = await deployer.deploy(FakeUNI, swapManagerAddress);
	const fakeFakeUSDTContract = await deployer.deploy(FakeUSDT, swapManagerAddress);
	const fakeFakeWBTCContract = await deployer.deploy(FakeWBTC, swapManagerAddress);
	const fakeFakeWETHContract = await deployer.deploy(FakeWETH, swapManagerAddress);
	const fakeFakeYFIContract = await deployer.deploy(FakeYFI, swapManagerAddress);	
};
