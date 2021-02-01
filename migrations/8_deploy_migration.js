const BridgeManager = artifacts.require('BridgeManager');
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

	deployer.deploy(BridgeManager).then(async function(bridgeManagerContract) {

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

		console.log('Registering fake tokens into bridgeManagerContract');

		console.log('Registering FakePrivi address',fakePriviContract.address)
		await bridgeManagerContract.registerTokenERC20('PRIVI Fake Token', 'PRIVI', fakePriviContract.address);

		console.log('Registering FakeBAL address',fakeFakeBALContract.address)
		await bridgeManagerContract.registerTokenERC20('BAL Fake Token', 'BAL', fakeFakeBALContract.address);

		console.log('Registering FakeBAT address',fakeFakeBATContract.address)
		await bridgeManagerContract.registerTokenERC20('BAT Fake Token', 'BAT', fakeFakeBATContract.address);
		
		console.log('Registering FakeCOMP address',fakeFakeCOMPContract.address)
		await bridgeManagerContract.registerTokenERC20('COMP Fake Token', 'COMP', fakeFakeCOMPContract.address);

		console.log('Registering FakeDAI address',fakeFakeDAIContract.address)
		await bridgeManagerContract.registerTokenERC20('DAI Fake Token', 'DAI', fakeFakeDAIContract.address);

		console.log('Registering FakeLINK address',fakeFakeLINKContract.address)
		await bridgeManagerContract.registerTokenERC20('LINK Fake Token', 'LINK', fakeFakeLINKContract.address);

		console.log('Registering FakeMKR address',fakeFakeMKRContract.address)
		await bridgeManagerContract.registerTokenERC20('MKR Fake Token', 'MKR', fakeFakeMKRContract.address);

		console.log('Registering FakeUNI address',fakeFakeUNIContract.address)
		await bridgeManagerContract.registerTokenERC20('UNI Fake Token', 'UNI', fakeFakeUNIContract.address);

		console.log('Registering FakeUSDT address',fakeFakeUSDTContract.address)
		await bridgeManagerContract.registerTokenERC20('USDT Fake Token', 'USDT', fakeFakeUSDTContract.address);

		console.log('Registering FakeWBTC address',fakeFakeWBTCContract.address)
		await bridgeManagerContract.registerTokenERC20('WBTC Fake Token', 'WBTC', fakeFakeWBTCContract.address);

		console.log('Registering FakeWETHaddress',fakeFakeWETHContract.address)
		await bridgeManagerContract.registerTokenERC20('WETH Fake Token', 'WETH', fakeFakeWETHContract.address);

		console.log('Registering FakeYFI address',fakeFakeYFIContract.address)
		await bridgeManagerContract.registerTokenERC20('YFI Fake Token', 'YFI', fakeFakeYFIContract.address);
	});
};
