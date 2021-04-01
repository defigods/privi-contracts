const { assert } = require('chai');
const errors = require('./utils/errors');

const BridgeManager = artifacts.require('BridgeManager');
const PRIVIPodERC1155Factory = artifacts.require('PRIVIPodERC1155Factory');
const PRIVIPodERC1155Token = artifacts.require('PRIVIPodERC1155Token');

contract('PRIVIPodERC1155Factory', (accounts) => {
	let bridgeManagerContract;
	let erc1155FactoryContract;

	const [moderator, investor, regularAccount] = accounts;

	const POD_CREATED_EVENT = 'PodCreated';
	const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

	const testPod = {
		uri: 'ipfs/test/pod/uri',
	};

	// Errors
	const UNIQUE_ID = errors.UNIQUE_ID('1155');
	const ONLY_MODERATOR = errors.ONLY_MODERATOR('1155');
	const INVESTMENT_ADDRESS = errors.INVESTMENT_ADDRESS('1155');
	const INVESTMENT_AMOUNT = errors.INVESTMENT_AMOUNT('1155');

	beforeEach(async () => {
		bridgeManagerContract = await BridgeManager.new();
		erc1155FactoryContract = await PRIVIPodERC1155Factory.new(bridgeManagerContract.address);
	});

	it('fails to deploy on already registered address', async () => {
		try {
			erc1155FactoryContract = await PRIVIPodERC1155Factory.new(bridgeManagerContract.address);
		} catch (e) {
			assert.equal(e.reason, errors.ALREADY_REGISTERED);
		}
	});

	it('creates a pod end emits a pod created event', async () => {
		await erc1155FactoryContract.createPod(testPod.uri);

		const podAddress = await erc1155FactoryContract.getPodAddressByUri(testPod.uri);

		assert.notEqual(podAddress, ZERO_ADDRESS);

		const [podCreatedEvent] = await erc1155FactoryContract.getPastEvents('allEvents');

		assert.equal(podCreatedEvent.event, POD_CREATED_EVENT);
		assert.equal(podCreatedEvent.returnValues.podAddress, podAddress);
	});

	it('fails to create a pod on existing pod uri', async () => {
		try {
			await erc1155FactoryContract.createPod(testPod.uri);
		} catch (e) {
			assert.equal(e.reason, UNIQUE_ID);
		}
	});

	it('correctly assigns parentFactory to pod token contract', async () => {
		await erc1155FactoryContract.createPod(testPod.uri);

		const podAddress = await erc1155FactoryContract.getPodAddressByUri(testPod.uri);
		const erc1155TokenContract = await PRIVIPodERC1155Token.at(podAddress);
		const podFactoryAddress = await erc1155TokenContract.parentFactory();

		assert.equal(erc1155FactoryContract.address, podFactoryAddress);
	});

	it('allows moderator to mint pod tokens for investor', async () => {
		const testToken = {
			tokenId: '1',
			amount: '20',
			data: web3.utils.fromAscii('Test token data'),
		};

		await erc1155FactoryContract.createPod(testPod.uri);

		await erc1155FactoryContract.podMint(testPod.uri, investor, testToken.tokenId, testToken.amount, testToken.data, {
			from: moderator,
		});

		const podAddress = await erc1155FactoryContract.getPodAddressByUri(testPod.uri);
		const erc1155TokenContract = await PRIVIPodERC1155Token.at(podAddress);
		const investorBalance = await erc1155TokenContract.balanceOf(investor, testToken.tokenId);

		assert.equal(investorBalance, '20');
	});

	it('fails to mint pod tokens for investor from non-moderator account', async () => {
		try {
			const testToken = {
				tokenId: '1',
				amount: '20',
				data: web3.utils.fromAscii('Test token data'),
			};

			await erc1155FactoryContract.createPod(testPod.uri);

			await erc1155FactoryContract.podMint(testPod.uri, investor, testToken.tokenId, testToken.amount, testToken.data, {
				from: regularAccount,
			});
		} catch (e) {
			assert.equal(e.reason, ONLY_MODERATOR);
		}
	});

	it('fails to mint pod tokens for investor on invalid address', async () => {
		try {
			const testToken = {
				tokenId: '1',
				amount: '20',
				data: web3.utils.fromAscii('Test token data'),
			};

			await erc1155FactoryContract.createPod(testPod.uri);

			await erc1155FactoryContract.podMint(
				testPod.uri,
				ZERO_ADDRESS,
				testToken.tokenId,
				testToken.amount,
				testToken.data,
				{
					from: moderator,
				}
			);
		} catch (e) {
			assert.equal(e.reason, INVESTMENT_ADDRESS);
		}
	});

	it('fails to mint pod tokens for investor on invalid amount', async () => {
		try {
			const testToken = {
				tokenId: '1',
				amount: '0',
				data: web3.utils.fromAscii('Test token data'),
			};

			await erc1155FactoryContract.createPod(testPod.uri);

			await erc1155FactoryContract.podMint(testPod.uri, investor, testToken.tokenId, testToken.amount, testToken.data, {
				from: moderator,
			});
		} catch (e) {
			assert.equal(e.reason, INVESTMENT_AMOUNT);
		}
	});
});