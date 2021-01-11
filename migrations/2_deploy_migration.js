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

module.exports = function (deployer, networks, accounts) {
	deployer.deploy(SwapManager).then(async function(swapManagerContract) {
		const swapManagerAddress = swapManagerContract.address;
		const fakePriviContract = await deployer.deploy(FakePrivi, swapManagerAddress);
		const fakeFakeBALContract = await deployer.deploy(FakeBAL, swapManagerAddress);
		const fakeFakeBATContract = await deployer.deploy(FakeBAT, swapManagerAddress);
		const fakeFakeCOMPContract = await deployer.deploy(FakeCOMP, swapManagerAddress);
		const fakeFakeDAIContract = await deployer.deploy(FakeDAI, swapManagerAddress);
		const fakeFakeLINKContract = await deployer.deploy(FakeLINK, swapManagerAddress);
	});
	
};
