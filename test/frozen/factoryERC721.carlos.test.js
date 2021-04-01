const { assert } = require('chai');
const errors = require('./utils/errors');

const BridgeManager = artifacts.require('BridgeManager');
const PRIVIPodERC721Factory = artifacts.require('PRIVIPodERC721Factory');
const PRIVIPodERC721Token = artifacts.require('PRIVIPodERC721Token');

contract('PRIVIPodERC721Factory', (accounts) => {
    let bridgeManagerContract;
    let erc721FactoryContract;

    const [moderator, investor, regularAccount] = accounts;

    const POD_CREATED_EVENT = 'PodCreated';
    const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

    const testPod = {
        id: '1',
        name: 'Test Token',
        symbol: 'TST',
        baseURI: 'https://test-token.com',
    };

    // Errors
    const UNIQUE_ID = errors.UNIQUE_ID('721');
    const UNIQUE_SYMBOL = errors.UNIQUE_SYMBOL('721');
    const ONLY_MODERATOR = errors.ONLY_MODERATOR('721');
    const INVESTMENT_ADDRESS = errors.INVESTMENT_ADDRESS('721');

    beforeEach(async () => {
        bridgeManagerContract = await BridgeManager.new();
        erc721FactoryContract = await PRIVIPodERC721Factory.new(bridgeManagerContract.address);
    });

    it('fails to deploy on already registered address', async () => {
        try {
            erc721FactoryContract = await PRIVIPodERC721Factory.new(bridgeManagerContract.address);
        } catch (e) {
            assert.equal(e.reason, errors.ALREADY_REGISTERED);
        }
    });

    it('creates a pod and emits a pod created event', async () => {
        await erc721FactoryContract.createPod(testPod.id, testPod.name, testPod.symbol, testPod.baseURI);

        const podAddress = await erc721FactoryContract.getPodAddressById(testPod.id);
        assert.notEqual(podAddress, ZERO_ADDRESS);

        const [podCreatedEvent] = await erc721FactoryContract.getPastEvents('allEvents');

        assert.equal(podCreatedEvent.event, POD_CREATED_EVENT);
        assert.equal(podCreatedEvent.returnValues.podTokenName, testPod.name);
        assert.equal(podCreatedEvent.returnValues.podTokenSymbol, testPod.symbol);
    });

    it('fails to create a pod on existing pod id', async () => {
        try {
            await erc721FactoryContract.createPod(testPod.id, testPod.name, testPod.symbol, testPod.baseURI);
        } catch (e) {
            assert.equal(e.reason, UNIQUE_ID);
        }
    });

    it('fails to create a pod on existing pod symbol', async () => {
        try {
            await erc721FactoryContract.createPod(testPod.id, testPod.name, testPod.symbol, testPod.baseURI);

            await erc721FactoryContract.createPod('2', 'some name', testPod.symbol, testPod.baseURI);
        } catch (e) {
            assert.equal(e.reason, UNIQUE_SYMBOL);
        }
    });

    it('fails to create a pod on empty name', async () => {
        try {
            await erc721FactoryContract.createPod(testPod.id, '', testPod.symbol, testPod.baseURI);
        } catch (e) {
            assert.equal(e.reason, errors.EMPTY_NAME);
        }
    });

    it('fails to create a pod on empty symbol', async () => {
        try {
            await erc721FactoryContract.createPod(testPod.id, testPod.name, '', testPod.baseURI);
        } catch (e) {
            assert.equal(e.reason, errors.EMPTY_SYMBOL);
        }
    });

    it('fails to create a pod on long symbol', async () => {
        try {
            await erc721FactoryContract.createPod(
                testPod.id,
                testPod.name,
                'THIS_SYMBOL_SHOULD_HAVE_A_LENGTH_LOWER_THAN_TWENTY_FIVE',
                testPod.baseURI
            );
        } catch (e) {
            assert.equal(e.reason, errors.SYMBOL_TOO_LONG);
        }
    });

    it('correctly assigns parentFactory to pod token contract', async () => {
        await erc721FactoryContract.createPod(testPod.id, testPod.name, testPod.symbol, testPod.baseURI);

        const podAddress = await erc721FactoryContract.getPodAddressById(testPod.id);
        const erc721TokenContract = await PRIVIPodERC721Token.at(podAddress);
        const podFactoryAddress = await erc721TokenContract.parentFactory();

        assert.equal(erc721FactoryContract.address, podFactoryAddress);
    });

    it('allows moderator to mint pod tokens by id for investor', async () => {
        await erc721FactoryContract.createPod(testPod.id, testPod.name, testPod.symbol, testPod.baseURI);

        await erc721FactoryContract.mintPodTokenById(testPod.id, investor, {
            from: moderator,
        });

        const podAddress = await erc721FactoryContract.getPodAddressById(testPod.id);
        const erc721TokenContract = await PRIVIPodERC721Token.at(podAddress);
        const investorBalance = await erc721TokenContract.balanceOf(investor);

        assert.equal(investorBalance, '1');
    });

    it('fails to mint pod tokens by id for investor from non-moderator account', async () => {
        try {
            await erc721FactoryContract.mintPodTokenById(testPod.id, investor, {
                from: regularAccount,
            });
        } catch (e) {
            assert.equal(e.reason, ONLY_MODERATOR);
        }
    });

    it('fails to mint pod tokens by id for investor on invalid address', async () => {
        try {
            await erc721FactoryContract.mintPodTokenById(testPod.id, ZERO_ADDRESS, {
                from: moderator,
            });
        } catch (e) {
            assert.equal(e.reason, INVESTMENT_ADDRESS);
        }
    });

    it('allows moderator to mint pod tokens by symbol for investor', async () => {
        await erc721FactoryContract.createPod(testPod.id, testPod.name, testPod.symbol, testPod.baseURI);

        await erc721FactoryContract.mintPodTokenBySymbol(testPod.symbol, investor, {
            from: moderator,
        });

        const podAddress = await erc721FactoryContract.getPodAddressById(testPod.id);
        const erc721TokenContract = await PRIVIPodERC721Token.at(podAddress);
        const investorBalance = await erc721TokenContract.balanceOf(investor);

        assert.equal(investorBalance, '1');
    });

    it('fails to mint pod tokens by symbol for investor from non-moderator account', async () => {
        try {
            await erc721FactoryContract.mintPodTokenById(testPod.symbol, investor, {
                from: regularAccount,
            });
        } catch (e) {
            assert.equal(e.reason, ONLY_MODERATOR);
        }
    });

    it('fails to mint pod tokens by symbol for investor on invalid address', async () => {
        try {
            await erc721FactoryContract.mintPodTokenBySymbol(testPod.symbol, ZERO_ADDRESS, {
                from: moderator,
            });
        } catch (e) {
            assert.equal(e.reason, INVESTMENT_ADDRESS);
        }
    });
});