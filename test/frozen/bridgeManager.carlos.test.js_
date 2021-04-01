const { assert } = require('chai');
const errors = require('./utils/errors');
const { registerToken } = require('./utils/helpers');

const BridgeManager = artifacts.require('BridgeManager');

contract('BridgeManager', (accounts) => {
    let bridgeManagerContract;

    const [admin, ERC20Address, ERC721Address, ERC1155Address] = accounts;

    const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

    const ROLES = {
        DEFAULT_ADMIN: ZERO_ADDRESS,
        REGISTER: web3.utils.keccak256('REGISTER_ROLE'),
    };

    const ROLE_EVENTS = {
        ADMIN_CHANGED: 'RoleAdminChanged',
        GRANTED: 'RoleGranted',
        REVOKED: 'RoleRevoked',
    };

    const erc20TestToken = {
        name: 'ERC20 Test Token',
        symbol: 'TST20',
        deployedAddress: ERC20Address,
        type: 'ERC20',
    };

    const erc721TestToken = {
        name: 'ERC721 Test Token',
        symbol: 'TST721',
        deployedAddress: ERC721Address,
        type: 'ERC721',
    };

    const erc1155TestToken = {
        name: 'ERC1155 Test Token',
        tokenURI: 'TST1155',
        deployedAddress: ERC1155Address,
        type: 'ERC1155',
    };

    beforeEach(async () => {
        bridgeManagerContract = await BridgeManager.new();
    });

    it('assigns default admin and register roles', async () => {
        const isAdminRole = await bridgeManagerContract.hasRole(ROLES.DEFAULT_ADMIN, admin);
        const isRegisterRole = await bridgeManagerContract.hasRole(ROLES.REGISTER, admin);

        assert.isTrue(isAdminRole);
        assert.isTrue(isRegisterRole);
    });

    it('emits role added event', async () => {
        const [roleGrantedEvent] = await bridgeManagerContract.getPastEvents('allEvents');

        assert.equal(roleGrantedEvent.event, ROLE_EVENTS.GRANTED);
        assert.equal(roleGrantedEvent.returnValues.account, admin);
        assert.equal(roleGrantedEvent.returnValues.sender, admin);
    });

    it('registers an ERC20 token', async () => {
        const { tokenCountEmpty, registeredAddress, tokenCount, tokenAddedEvent } = await registerToken(
            bridgeManagerContract,
            erc20TestToken
        );

        // Find way to test indexed event values
        //assert.equal(tokenAddedEvent.event, getTokenEventName('register', TOKENS.ERC20));
        assert.equal(tokenCountEmpty, 0);
        assert.equal(tokenAddedEvent.returnValues.address, erc20TestToken.address);
        assert.equal(registeredAddress, erc20TestToken.deployedAddress);
        assert.equal(tokenCount, 1);
    });

    it('fails to register an ERC20 token on already registered address', async () => {
        const erc20Token2 = {
            name: 'ERC20 Test Token 2',
            symbol: 'TST20 2',
            deployedAddress: ERC20Address,
        };

        try {
            await bridgeManagerContract.registerTokenERC20(
                erc20TestToken.name,
                erc20TestToken.symbol,
                erc20TestToken.deployedAddress
            );
            await bridgeManagerContract.registerTokenERC20(erc20Token2.name, erc20Token2.symbol, erc20Token2.deployedAddress);
        } catch (e) {
            assert.equal(e.reason, errors.ALREADY_REGISTERED);
        }
    });

    it('registers an ERC721 token', async () => {
        const { tokenCountEmpty, registeredAddress, tokenCount, tokenAddedEvent } = await registerToken(
            bridgeManagerContract,
            erc721TestToken
        );

        assert.equal(tokenCountEmpty, 0);
        assert.equal(tokenAddedEvent.returnValues.address, erc721TestToken.address);
        assert.equal(registeredAddress, erc721TestToken.deployedAddress);
        assert.equal(tokenCount, 1);
    });

    it('fails to register an ERC721 token on already registered address', async () => {
        const erc721Token2 = {
            name: 'ERC721 Test Token 2',
            symbol: 'TST721 2',
            deployedAddress: ERC721Address,
        };

        try {
            await bridgeManagerContract.registerTokenERC721(
                erc721TestToken.name,
                erc721TestToken.symbol,
                erc721TestToken.deployedAddress
            );
            await bridgeManagerContract.registerTokenERC721(
                erc721Token2.name,
                erc721Token2.symbol,
                erc721Token2.deployedAddress
            );
        } catch (e) {
            assert.equal(e.reason, errors.ALREADY_REGISTERED);
        }
    });

    it('registers an ERC1155 token', async () => {
        const { tokenCountEmpty, registeredAddress, tokenCount, tokenAddedEvent } = await registerToken(
            bridgeManagerContract,
            erc1155TestToken
        );

        assert.equal(tokenCountEmpty, 0);
        assert.equal(tokenAddedEvent.returnValues.address, erc1155TestToken.address);
        assert.equal(registeredAddress, erc1155TestToken.deployedAddress);
        assert.equal(tokenCount, 1);
    });

    it('fails to register an ERC1155 token on already registered address', async () => {
        const erc1155Token2 = {
            name: 'ERC1155 Test Token 2',
            tokenURI: 'TST1155 2',
            deployedAddress: ERC1155Address,
        };

        try {
            await bridgeManagerContract.registerTokenERC1155(
                erc1155TestToken.name,
                erc1155TestToken.tokenURI,
                erc1155TestToken.deployedAddress
            );
            await bridgeManagerContract.registerTokenERC1155(
                erc1155Token2.name,
                erc1155Token2.tokenURI,
                erc1155Token2.deployedAddress
            );
        } catch (e) {
            assert.equal(e.reason, errors.ALREADY_REGISTERED);
        }
    });
});
