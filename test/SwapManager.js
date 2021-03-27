//const errors = require('./utils/errors');
//const { registerToken } = require('./utils/helpers');
const { expectRevert, balance, ether, BN } = require('@openzeppelin/test-helpers');
const assert = require('assert');

const SwapManager = artifacts.require('SwapManager');
const BridgeManager = artifacts.require('BridgeManager');
const PodERC20Factory = artifacts.require('PRIVIPodERC20Factory');
const PodERC721Factory = artifacts.require('PRIVIPodERC721Factory');
const PodERC721RoyaltyFactory = artifacts.require('PRIVIPodERC721RoyaltyFactory');
const PodERC1155Factory = artifacts.require('PRIVIPodERC1155Factory');
const PodERC1155RoyaltyFactory = artifacts.require('PRIVIPodERC1155RoyaltyFactory');

contract('Swap Manager', (accounts) => {
    let swapManagerContract;
    let bridgeManagerContract;
    let podERC20Factory;
    let podERC721Factory;
    let podERC721RoyaltyFactory;
    let podERC1155Factory;
    let podERC1155RoyaltyFactory;
    const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
    const [admin, mod1, investor1, hacker, ...rest] = accounts

    // const ROLES = {
    //   DEFAULT_ADMIN: ZERO_ADDRESS,
    //   REGISTER: web3.utils.keccak256('REGISTER_ROLE'),
    // };

    // const ROLE_EVENTS = {
    //   ADMIN_CHANGED: 'RoleAdminChanged',
    //   GRANTED: 'RoleGranted',
    //   REVOKED: 'RoleRevoked',
    // };

    beforeEach(async () => {
        bridgeManagerContract = await BridgeManager.new({ from: admin });
        podERC20Factory = await PodERC20Factory.new(bridgeManagerContract.address, { from: admin });
        podERC721Factory = await PodERC721Factory.new(bridgeManagerContract.address, { from: admin });
        podERC721RoyaltyFactory = await PodERC721RoyaltyFactory.new(bridgeManagerContract.address, { from: admin });
        podERC1155Factory = await PodERC1155Factory.new(bridgeManagerContract.address, { from: admin });
        podERC1155RoyaltyFactory = await PodERC1155RoyaltyFactory.new(bridgeManagerContract.address, { from: admin });
        swapManagerContract = await SwapManager.new(
            bridgeManagerContract.address,
            podERC20Factory.address,
            podERC721Factory.address,
            podERC721RoyaltyFactory.address,
            podERC1155Factory.address,
            podERC1155RoyaltyFactory.address,
            { from: admin }
        );
    });

    it('should not deposit ERC20 token if not registered in Bridge', async () => {
        await expectRevert(
            swapManagerContract.depositERC20Token('SJS', 15, {from: investor1}),
            'SwapManager: token is not registered into the platform'
        );
    });

    // it('should not deposit ERC20 token if not approved by user', async () => {
    //     await bridgeManagerContract.registerTokenERC20(
    //         'The SJS Token',
    //         'SJS',
    //         // Address
    //     )
    //     await expectRevert(
    //         swapManagerContract.depositERC20Token('SJS', 15, {from: investor1}),
    //         'SwapManager: token is not registered into the platform'
    //     );
    // });



});