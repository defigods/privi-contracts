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
const FakeYFI = artifacts.require("FakeYFI");

module.exports = function (deployer, networks, accounts) {
	deployer.deploy(SwapManager).then(async function(swapManagerContract) {
		const fakePriviContract = await deployer.deploy(FakePrivi);
		const fakeFakeBALContract = await deployer.deploy(FakeBAL);
		const fakeFakeBATContract = await deployer.deploy(FakeBAT);
		const fakeFakeCOMPContract = await deployer.deploy(FakeCOMP);
		const fakeFakeDAIContract = await deployer.deploy(FakeDAI);
		const fakeFakeLINKContract = await deployer.deploy(FakeLINK);
		const fakeFakeMKRContract = await deployer.deploy(FakeMKR);
		const fakeFakeUNIContract = await deployer.deploy(FakeUNI);
		const fakeFakeUSDTContract = await deployer.deploy(FakeUSDT);
		const fakeFakeWBTCContract = await deployer.deploy(FakeWBTC);
		const fakeFakeYFIContract = await deployer.deploy(FakeYFI);

		console.log('Registering fake tokens into swapManager');

		console.log('Registering FakePrivi address',fakePriviContract.address)
		await swapManagerContract.registerTokenERC20('PRIVI', fakePriviContract.address);

		console.log('Registering FakeBAL address',fakeFakeBALContract.address)
		await swapManagerContract.registerTokenERC20('BAL', fakeFakeBALContract.address);

		console.log('Registering FakeBAT address',fakeFakeBATContract.address)
		await swapManagerContract.registerTokenERC20('BAT', fakeFakeBATContract.address);
		
		console.log('Registering FakeCOMP address',fakeFakeCOMPContract.address)
		await swapManagerContract.registerTokenERC20('COMP', fakeFakeCOMPContract.address);

		console.log('Registering FakeDAI address',fakeFakeDAIContract.address)
		await swapManagerContract.registerTokenERC20('DAI', fakeFakeDAIContract.address);

		console.log('Registering FakeLINK address',fakeFakeLINKContract.address)
		await swapManagerContract.registerTokenERC20('LINK', fakeFakeLINKContract.address);

		console.log('Registering FakeMKR address',fakeFakeMKRContract.address)
		await swapManagerContract.registerTokenERC20('MKR', fakeFakeMKRContract.address);

		console.log('Registering FakeUNI address',fakeFakeUNIContract.address)
		await swapManagerContract.registerTokenERC20('UNI', fakeFakeUNIContract.address);

		console.log('Registering FakeUSDT address',fakeFakeUSDTContract.address)
		await swapManagerContract.registerTokenERC20('USDT', fakeFakeUSDTContract.address);

		console.log('Registering FakeWBTC address',fakeFakeWBTCContract.address)
		await swapManagerContract.registerTokenERC20('WBTC', fakeFakeWBTCContract.address);

		console.log('Registering FakeYFI address',fakeFakeYFIContract.address)
		await swapManagerContract.registerTokenERC20('YFI', fakeFakeYFIContract.address);

	});
	
};
