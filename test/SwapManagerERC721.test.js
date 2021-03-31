const { expectRevert, expectEvent, balance, ether, BN, ZERO_ADDRESS } = require('@openzeppelin/test-helpers');
const web3 = require('web3');
const assert = require('assert');

// Artifacts
const SwapManager = artifacts.require('SwapManager');
const BridgeManager = artifacts.require('BridgeManager');
const PodERC20Factory = artifacts.require('PRIVIPodERC20Factory');
const PodERC721Factory = artifacts.require('PRIVIPodERC721Factory');
const PodERC721RoyaltyFactory = artifacts.require('PRIVIPodERC721RoyaltyFactory');
const PodERC1155Factory = artifacts.require('PRIVIPodERC1155Factory');
const PodERC1155RoyaltyFactory = artifacts.require('PRIVIPodERC1155RoyaltyFactory');
const FakeUNI = artifacts.require('FakeUNI');
const IERC20 = artifacts.require('IERC20');

contract('SwapManager for ERC721 tokens', (accounts) => {
    let swapManagerContract;
    let bridgeManagerContract;
    let podERC20Factory;
    let podERC721Factory;
    let podERC721RoyaltyFactory;
    let podERC1155Factory;
    let podERC1155RoyaltyFactory;
    let fakeUni;
    const [admin, investor1, hacker] = accounts

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

        // Assign MODERATOR_ROLE to SwapManager contract in Factory contracts
        await podERC721Factory.assignRoleSwapManager(swapManagerContract.address, { from: admin });

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

    /*********** CHECK depositERC721Token() **************/

    it('depositERC721Token(): should not deposit ERC20 tokens if not registered in Bridge', async () => {
        await expectRevert(
            swapManagerContract.depositERC721Token('NON_EXISTING', 15, { from: investor1 }),
            'SwapManager: token is not registered into the platform'
        );
    });

    it('depositERC721Token(): should not deposit ERC20 tokens if not approved by user', async () => {
        await expectRevert(
            swapManagerContract.depositERC721Token('UNI', 15, { from: investor1 }),
            'SwapManager: token amount to be transferred to PRIVI is not yet approved by User'
        );
    });

    it('depositERC721Token(): should deposit ERC20 tokens', async () => {
        const balanceSwapBefore = await fakeUni.balanceOf(swapManagerContract.address);

        await fakeUni.approve(swapManagerContract.address, 300, { from: investor1 });
        await swapManagerContract.depositERC721Token('UNI', 300, { from: investor1 });

        const balanceSwapAfter = await fakeUni.balanceOf(swapManagerContract.address);

        assert(balanceSwapBefore.toString() === '0', 'Swap balance should be 0');
        assert(balanceSwapAfter.toString() === '300', 'Swap balance should be 300');
    });

    /*********** CHECK withdrawERC721Token() **************/


    it('withdrawERC721Token(): should not withdraw ERC20 tokens - amount must be > 0', async () => {
        await expectRevert(
            swapManagerContract.withdrawERC721Token('UNI', investor1, 0, { from: admin }),
            'SwapManager: amount must be greater than 0'
        );
    });

    it('withdrawERC721Token(): should not withdraw ERC20 tokens - only TRANSFER_ROLE', async () => {
        await expectRevert(
            swapManagerContract.withdrawERC721Token('UNI', hacker, 15, { from: hacker }),
            'SwapManager: must have TRANSFER_ROLE to withdraw token'
        );
    });

    it('withdrawERC721Token(): should not withdraw ERC20 tokens - cannot withdraw any amount', async () => {
        await fakeUni.approve(swapManagerContract.address, 300, { from: investor1 });
        await swapManagerContract.depositERC721Token('UNI', 300, { from: investor1 });

        await expectRevert(
            swapManagerContract.withdrawERC721Token('UNI', investor1, 400, { from: admin }),
            'SwapManager: cannot withdraw any amount'
        );
    });

    it('withdrawERC721Token(): should withdraw ERC20 tokens', async () => {
        const balanceSwapBefore = await fakeUni.balanceOf(swapManagerContract.address);

        await fakeUni.approve(swapManagerContract.address, 300, { from: investor1 });
        await swapManagerContract.depositERC721Token('UNI', 300, { from: investor1 });
        const txReceipt = await swapManagerContract.withdrawERC721Token('UNI', investor1, 50, { from: admin });

        const balanceSwapAfter = await fakeUni.balanceOf(swapManagerContract.address);

        assert(balanceSwapBefore.toString() === '0', 'Swap balance should be 0');
        assert(balanceSwapAfter.toString() === '250', 'Swap balance should be 250');

        expectEvent(txReceipt, 'withdrawERC721Token', {
            //tokenSymbol: 'UNI',
            to: investor1,
            amount: new BN(50),
        });
    });

    it('withdrawERC721Token(): should mint ERC20 tokens', async () => {
        // Create 'TST' contract through PodERC20 factory
        await podERC20Factory.createPod(1, 'Test Token', 'TST', { from: admin });
        const newPodERC20Address = await podERC20Factory.getPodAddressById(1);

        // Mint 'TST' tokens
        await podERC20Factory.mintPodTokenById(1, newPodERC20Address, 2000, { from: admin });
        const newPodERC20 = await IERC20.at(newPodERC20Address);
        const balancePodBefore = await newPodERC20.totalSupply();

        // Withdraw 'TST' tokens
        const txReceipt = await swapManagerContract.withdrawERC721Token('TST', investor1, 50, { from: admin });
        const balancePodAfter = await newPodERC20.totalSupply();

        assert(balancePodBefore.toString() === '2000', 'Swap balance should be 2000');
        assert(balancePodAfter.toString() === '2050', 'Swap balance should be 2050');

        expectEvent(txReceipt, 'withdrawERC721Token', {
            //tokenSymbol: 'UNI',
            to: investor1,
            amount: new BN(50),
        });
    });

});