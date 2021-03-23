const errors = require('./utils/errors');
const { registerToken } = require('./utils/helpers');
const { expectRevert, balance, ether, BN } = require('@openzeppelin/test-helpers');

const BridgeManager = artifacts.require('BridgeManager');

contract('SJS Tests', (accounts) => {
    let bridgeManagerContract;

    const [admin, ERC20Address] = accounts;

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
    

    

    

});