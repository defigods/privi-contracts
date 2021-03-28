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
const FakeUNI = artifacts.require('FakeUNI');

contract('Swap Manager', (accounts) => {
    let swapManagerContract;
    let bridgeManagerContract;
    let podERC20Factory;
    let podERC721Factory;
    let podERC721RoyaltyFactory;
    let podERC1155Factory;
    let podERC1155RoyaltyFactory;
    let fakeUni;
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
        // Bridge contract
        bridgeManagerContract = await BridgeManager.new({ from: admin });

        // Factory contracts
        podERC20Factory = await PodERC20Factory.new(bridgeManagerContract.address, { from: admin });
        podERC721Factory = await PodERC721Factory.new(bridgeManagerContract.address, { from: admin });
        podERC721RoyaltyFactory = await PodERC721RoyaltyFactory.new(bridgeManagerContract.address, { from: admin });
        podERC1155Factory = await PodERC1155Factory.new(bridgeManagerContract.address, { from: admin });
        podERC1155RoyaltyFactory = await PodERC1155RoyaltyFactory.new(bridgeManagerContract.address, { from: admin });
        
        // Swap contract
        swapManagerContract = await SwapManager.new(
            bridgeManagerContract.address,
            podERC20Factory.address,
            podERC721Factory.address,
            podERC721RoyaltyFactory.address,
            podERC1155Factory.address,
            podERC1155RoyaltyFactory.address,
            { from: admin }
        );

        // Fake UNI contract
        fakeUni = await FakeUNI.new(swapManagerContract.address, { from: admin });

        // Give 1000 UNI tokens to investor1
        await fakeUni.mintForUser(investor1, 1000, { from: admin });

        // Register UNI token in Bridge
        await bridgeManagerContract.registerTokenERC20(
            'Uniswap',
            'UNI',
            fakeUni.address
        );
    });

    /*********** CHECK depositERC20Token() **************/

    it('should not deposit ERC20 tokens if not registered in Bridge', async () => {
        await expectRevert(
            swapManagerContract.depositERC20Token('NON_EXISTING', 15, { from: investor1 }),
            'SwapManager: token is not registered into the platform'
        );
    });

    it('should not deposit ERC20 tokens if not approved by user', async () => {
        await expectRevert(
            swapManagerContract.depositERC20Token('UNI', 15, { from: investor1 }),
            'SwapManager: token amount to be transferred to PRIVI is not yet approved by User'
        );
    });

    it('should deposit ERC20 tokens', async () => {
        const balanceSwapBefore = await fakeUni.balanceOf(swapManagerContract.address); 

        await fakeUni.approve(swapManagerContract.address, 300, { from: investor1 });
        await swapManagerContract.depositERC20Token('UNI', 300, { from: investor1 });

        const balanceSwapAfter = await fakeUni.balanceOf(swapManagerContract.address); 

        assert(balanceSwapBefore.toString() === '0', 'Swap balance should be 0');
        assert(balanceSwapAfter.toString() === '300', 'Swap balance should be 300');
    });

    /*********** CHECK withdrawERC20Token() **************/

    it('should not withdraw ERC20 tokens - only TRANSFER_ROLE', async () => {
        await expectRevert(
            swapManagerContract.withdrawERC20Token('UNI', hacker, 15, { from: hacker }),
            'SwapManager: must have TRANSFER_ROLE to withdraw token'
        );
    });

    it('should withdraw ERC20 tokens', async () => {
        const balanceSwapBefore = await fakeUni.balanceOf(swapManagerContract.address); 

        await fakeUni.approve(swapManagerContract.address, 300, { from: investor1 });
        await swapManagerContract.depositERC20Token('UNI', 300, { from: investor1 });
        await swapManagerContract.withdrawERC20Token('UNI', investor1, 50, { from: admin });

        const balanceSwapAfter = await fakeUni.balanceOf(swapManagerContract.address); 

        assert(balanceSwapBefore.toString() === '0', 'Swap balance should be 0');
        assert(balanceSwapAfter.toString() === '250', 'Swap balance should be 250');
    });

    // Remark: shouldn't SwapManager revert if not ERC20 token can be withdrawn?

});