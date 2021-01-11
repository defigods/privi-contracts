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
		const fakePriviContract = await FakePrivi.deployed();
		const fakeFakeBALContract = await FakeBAL.deployed();
		const fakeFakeBATContract = await FakeBAT.deployed();
		const fakeFakeCOMPContract = await FakeCOMP.deployed();
		const fakeFakeDAIContract = await FakeDAI.deployed();
		const fakeFakeLINKContract = await FakeLINK.deployed();
		const fakeFakeMKRContract = await FakeMKR.deployed();
		const fakeFakeUNIContract = await FakeUNI.deployed();
		const fakeFakeUSDTContract = await FakeUSDT.deployed();
		const fakeFakeWBTCContract = await FakeWBTC.deployed();
		const fakeFakeWETHContract = await FakeWETH.deployed();
		const fakeFakeYFIContract = await FakeYFI.deployed();

		console.log('Registering fake tokens into swapManager');

		// console.log('Registering FakePrivi address',fakePriviContract.address)
		// await swapManagerContract.registerTokenERC20('PRIVI', fakePriviContract.address);

		// console.log('Registering FakeBAL address',fakeFakeBALContract.address)
		// await swapManagerContract.registerTokenERC20('BAL', fakeFakeBALContract.address);

		// console.log('Registering FakeBAT address',fakeFakeBATContract.address)
		// await swapManagerContract.registerTokenERC20('BAT', fakeFakeBATContract.address);
		
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

		console.log('Registering FakeWETHaddress',fakeFakeWETHContract.address)
		await swapManagerContract.registerTokenERC20('WETH', fakeFakeWETHContract.address);

		console.log('Registering FakeYFI address',fakeFakeYFIContract.address)
		await swapManagerContract.registerTokenERC20('YFI', fakeFakeYFIContract.address);
	
};
