const { assert } = require('chai');
const errors = require('./utils/errors');

const BridgeManager = artifacts.require('BridgeManager');
const PRIVIPodERC20Factory = artifacts.require('PRIVIPodERC20Factory');
const PRIVIPodERC20Token = artifacts.require('PRIVIPodERC20Token');

contract('PRIVIPodERC20Factory', (accounts) => {
  let bridgeManagerContract;
  let erc20FactoryContract;

  const [moderator, investor, regularAccount] = accounts;

  const POD_CREATED_EVENT = 'PodCreated';
  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

  const testPod = {
    id: '1',
    name: 'Test Token',
    symbol: 'TST',
  };

  // Errors
  const UNIQUE_ID = errors.UNIQUE_ID('20');
  const UNIQUE_SYMBOL = errors.UNIQUE_SYMBOL('20');
  const ONLY_MODERATOR = errors.ONLY_MODERATOR('20');
  const INVESTMENT_ADDRESS = errors.INVESTMENT_ADDRESS('20');
  const INVESTMENT_AMOUNT = errors.INVESTMENT_AMOUNT('20');

  beforeEach(async () => {
    bridgeManagerContract = await BridgeManager.new();
    erc20FactoryContract = await PRIVIPodERC20Factory.new(bridgeManagerContract.address);
  });

  it('fails to deploy on already registered address', async () => {
    try {
      erc20FactoryContract = await PRIVIPodERC20Factory.new(bridgeManagerContract.address);
    } catch (e) {
      assert.equal(e.reason, errors.ALREADY_REGISTERED);
    }
  });

  it('creates a pod and emits a pod created event', async () => {
    await erc20FactoryContract.createPod(testPod.id, testPod.name, testPod.symbol);

    const podAddress = await erc20FactoryContract.getPodAddressById(testPod.id);
    assert.notEqual(podAddress, ZERO_ADDRESS);

    const [podCreatedEvent] = await erc20FactoryContract.getPastEvents('allEvents');

    assert.equal(podCreatedEvent.event, POD_CREATED_EVENT);
    assert.equal(podCreatedEvent.returnValues.podTokenName, testPod.name);
    assert.equal(podCreatedEvent.returnValues.podTokenSymbol, testPod.symbol);
  });

  it('fails to create a pod on existing pod id', async () => {
    try {
      await erc20FactoryContract.createPod(testPod.id, testPod.name, testPod.symbol);
    } catch (e) {
      assert.equal(e.reason, UNIQUE_ID);
    }
  });

  it('fails to create a pod on existing pod symbol', async () => {
    try {
      await erc20FactoryContract.createPod('2', testPod.name, testPod.symbol);
    } catch (e) {
      assert.equal(e.reason, UNIQUE_SYMBOL);
    }
  });

  it('fails to create a pod on empty name', async () => {
    try {
      await erc20FactoryContract.createPod('3', '', 'Sym');
    } catch (e) {
      assert.equal(e.reason, errors.EMPTY_NAME);
    }
  });

  it('fails to create a pod on empty symbol', async () => {
    try {
      await erc20FactoryContract.createPod('4', 'NAME', '');
    } catch (e) {
      assert.equal(e.reason, errors.EMPTY_SYMBOL);
    }
  });

  it('fails to create a pod on long symbol', async () => {
    try {
      await erc20FactoryContract.createPod('5', 'NAME', 'THIS_SYMBOL_SHOULD_HAVE_A_LENGTH_LOWER_THAN_TWENTY_FIVE');
    } catch (e) {
      assert.equal(e.reason, errors.SYMBOL_TOO_LONG);
    }
  });

  it('correctly assigns parentFactory to pod token contract', async () => {
    await erc20FactoryContract.createPod(testPod.id, testPod.name, testPod.symbol);

    const podAddress = await erc20FactoryContract.getPodAddressById(testPod.id);
    const erc20TokenContract = await PRIVIPodERC20Token.at(podAddress);
    const podFactoryAddress = await erc20TokenContract.parentFactory();

    assert.equal(erc20FactoryContract.address, podFactoryAddress);
  });

  it('allows moderator to mint pod tokens by id for investor', async () => {
    const amount = '100000000';
    await erc20FactoryContract.createPod(testPod.id, testPod.name, testPod.symbol);

    await erc20FactoryContract.mintPodTokenById(testPod.id, investor, amount, {
      from: moderator,
    });

    const podAddress = await erc20FactoryContract.getPodAddressById(testPod.id);
    const erc20TokenContract = await PRIVIPodERC20Token.at(podAddress);
    const investorBalance = await erc20TokenContract.balanceOf(investor);

    assert.equal(investorBalance, amount);
  });

  it('fails to mint pod tokens by id for investor from non-moderator account', async () => {
    const amount = '100000000';
    try {
      await erc20FactoryContract.mintPodTokenById(testPod.id, investor, amount, {
        from: regularAccount,
      });
    } catch (e) {
      assert.equal(e.reason, ONLY_MODERATOR);
    }
  });

  it('fails to mint pod tokens by id for investor on invalid address', async () => {
    const amount = '100000000';
    try {
      await erc20FactoryContract.mintPodTokenById(testPod.id, ZERO_ADDRESS, amount, {
        from: moderator,
      });
    } catch (e) {
      assert.equal(e.reason, INVESTMENT_ADDRESS);
    }
  });

  it('fails to mint pod tokens by id for investor on invalid amount', async () => {
    const amount = '0';
    try {
      await erc20FactoryContract.mintPodTokenById(testPod.id, investor, amount, {
        from: moderator,
      });
    } catch (e) {
      assert.equal(e.reason, INVESTMENT_AMOUNT);
    }
  });

  it('allows moderator to mint pod tokens by symbol for investor', async () => {
    const amount = '100000000';
    await erc20FactoryContract.createPod(testPod.id, testPod.name, testPod.symbol);

    await erc20FactoryContract.mintPodTokenBySymbol(testPod.symbol, investor, amount, {
      from: moderator,
    });

    const podAddress = await erc20FactoryContract.getPodAddressById(testPod.id);
    const erc20TokenContract = await PRIVIPodERC20Token.at(podAddress);
    const investorBalance = await erc20TokenContract.balanceOf(investor);

    assert.equal(investorBalance, amount);
  });

  it('fails to mint pod tokens by symbol for investor from non-moderator account', async () => {
    const amount = '100000000';
    try {
      await erc20FactoryContract.mintPodTokenById(testPod.symbol, investor, amount, {
        from: regularAccount,
      });
    } catch (e) {
      assert.equal(e.reason, ONLY_MODERATOR);
    }
  });

  it('fails to mint pod tokens by symbol for investor on invalid address', async () => {
    const amount = '100000000';
    try {
      await erc20FactoryContract.mintPodTokenById(testPod.symbol, ZERO_ADDRESS, amount, {
        from: moderator,
      });
    } catch (e) {
      assert.equal(e.reason, INVESTMENT_ADDRESS);
    }
  });

  it('fails to mint pod tokens by symbol for investor on invalid amount', async () => {
    const amount = '0';
    try {
      await erc20FactoryContract.mintPodTokenById(testPod.symbol, investor, amount, {
        from: moderator,
      });
    } catch (e) {
      assert.equal(e.reason, INVESTMENT_AMOUNT);
    }
  });
});
