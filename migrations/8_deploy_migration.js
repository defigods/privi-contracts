const BridgeManager = artifacts.require('BridgeManager');
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

		const bridgeManagerContract = await BridgeManager.deployed();
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

		console.log('Registering FakePrivi address',fakePriviContract.address)
		await bridgeManagerContract.registerTokenERC20('PRIVI Token', 'PRIVI', fakePriviContract.address);

		console.log('Registering FakeBAL address',fakeFakeBALContract.address)
		await bridgeManagerContract.registerTokenERC20('BAL Token', 'BAL', fakeFakeBALContract.address);

		console.log('Registering FakeBAT address',fakeFakeBATContract.address)
		await bridgeManagerContract.registerTokenERC20('BAT Token', 'BAT', fakeFakeBATContract.address);
		
		console.log('Registering FakeCOMP address',fakeFakeCOMPContract.address)
		await bridgeManagerContract.registerTokenERC20('COMP Token', 'COMP', fakeFakeCOMPContract.address);

		console.log('Registering FakeDAI address',fakeFakeDAIContract.address)
		await bridgeManagerContract.registerTokenERC20('DAI Token', 'DAI', fakeFakeDAIContract.address);

		console.log('Registering FakeLINK address',fakeFakeLINKContract.address)
		await bridgeManagerContract.registerTokenERC20('LINK Token', 'LINK', fakeFakeLINKContract.address);

		console.log('Registering FakeMKR address',fakeFakeMKRContract.address)
		await bridgeManagerContract.registerTokenERC20('MKR Token', 'MKR', fakeFakeMKRContract.address);

		console.log('Registering FakeUNI address',fakeFakeUNIContract.address)
		await bridgeManagerContract.registerTokenERC20('UNI Token', 'UNI', fakeFakeUNIContract.address);

		console.log('Registering FakeUSDT address',fakeFakeUSDTContract.address)
		await bridgeManagerContract.registerTokenERC20('USDT Token', 'USDT', fakeFakeUSDTContract.address);

		console.log('Registering FakeWBTC address',fakeFakeWBTCContract.address)
		await bridgeManagerContract.registerTokenERC20('WBTC Token', 'WBTC', fakeFakeWBTCContract.address);

		console.log('Registering FakeWETHaddress',fakeFakeWETHContract.address)
		await bridgeManagerContract.registerTokenERC20('WETH Token', 'WETH', fakeFakeWETHContract.address);

		console.log('Registering FakeYFI address',fakeFakeYFIContract.address)
		await bridgeManagerContract.registerTokenERC20('YFI Token', 'YFI', fakeFakeYFIContract.address);
	
};
