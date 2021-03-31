const { expectRevert, expectEvent, balance, ether, BN, ZERO_ADDRESS } = require('@openzeppelin/test-helpers');
const assert = require('assert');

// Artifacts
const SwapManager = artifacts.require('SwapManager');
const BridgeManager = artifacts.require('BridgeManager');
const PodERC20Factory = artifacts.require('PRIVIPodERC20Factory');
const PodERC721Factory = artifacts.require('PRIVIPodERC721Factory');
const PodERC721RoyaltyFactory = artifacts.require('PRIVIPodERC721RoyaltyFactory');
const PodERC1155Factory = artifacts.require('PRIVIPodERC1155Factory');
const PodERC1155RoyaltyFactory = artifacts.require('PRIVIPodERC1155RoyaltyFactory');
const FakeERC721 = artifacts.require('PRIVIPodERC721Token');
const IERC721 = artifacts.require('IERC721');

contract('SwapManager for ERC721 tokens', (accounts) => {
    let swapManagerContract;
    let bridgeManagerContract;
    let podERC20Factory;
    let podERC721Factory;
    let podERC721RoyaltyFactory;
    let podERC1155Factory;
    let podERC1155RoyaltyFactory;
    let fakeERC721;
    const [admin, investor1, hacker, creator] = accounts

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
            podERC1155Factory.address,
            podERC721RoyaltyFactory.address,
            podERC1155RoyaltyFactory.address,
            { from: admin }
        );

        // Assign MODERATOR_ROLE to SwapManager contract in Factory contracts
        await podERC721Factory.assignRoleSwapManager(swapManagerContract.address, { from: admin });
        await podERC721RoyaltyFactory.assignRoleSwapManager(swapManagerContract.address, { from: admin });

        // Fake ERC721 contract
        fakeERC721 = await FakeERC721.new(
            'Token Test',
            'TST',
            'ipfs://test',
            admin,
            { from: admin }
        );

        // Mint TST token to investor1
        await fakeERC721.mint(investor1, { from: admin });

        // Register TEST token in Bridge
        await bridgeManagerContract.registerTokenERC721(
            'Token Test',
            'TST',
            fakeERC721.address,
        );
    });

    /*********** CHECK depositERC721Token() **************/

    it('depositERC721Token(): should not deposit ERC721 tokens - not registered', async () => {
        await expectRevert(
            swapManagerContract.depositERC721Token('NON_EXISTING', 15, { from: investor1 }),
            'SwapManager: token is not registered into the platform'
        );
    });

    it('depositERC721Token(): should not deposit ERC721 tokens - non existing tokenId', async () => {
        await expectRevert(
            swapManagerContract.depositERC721Token('TST', 15, { from: investor1 }),
            'ERC721: approved query for nonexistent token'
        );
    });

    it('depositERC721Token(): should not deposit ERC721 tokens - not approved', async () => {
        await expectRevert(
            swapManagerContract.depositERC721Token('TST', 0, { from: investor1 }),
            'SwapManager: token to be transferred to PRIVI is not yet approved by User'
        );
    });

    it('depositERC721Token(): should deposit ERC721 tokens', async () => {
        const balanceSwapBefore = await fakeERC721.balanceOf(swapManagerContract.address);

        await fakeERC721.approve(swapManagerContract.address, 0, { from: investor1 });
        const txReceipt = await swapManagerContract.depositERC721Token('TST', 0, { from: investor1 });

        const balanceSwapAfter = await fakeERC721.balanceOf(swapManagerContract.address);

        assert(balanceSwapBefore.toString() === '0', 'Swap balance should be 0');
        assert(balanceSwapAfter.toString() === '1', 'Swap balance should be 1');

        expectEvent(txReceipt, 'DepositERC721Token', {
            //tokenSymbol: 'UNI',
            from: investor1,
            tokenId: new BN(0),
        });
    });

    /*********** CHECK withdrawERC721Token() **************/

    it('withdrawERC721Token(): should not withdraw ERC721 tokens - TRANSFER_ROLE only', async () => {
        await expectRevert(
            swapManagerContract.withdrawERC721Token(
                'TST',      // tokenSymbol
                investor1,  // to
                0,          // tokenId
                false,      // isPodMint
                false,      // isRoyalty
                { from: hacker }),
            'SwapManager: must have TRANSFER_ROLE to withdraw token'
        );
    });

    it('withdrawERC721Token(): should not withdraw ERC721 tokens - cannot withdraw royalty token', async () => {
        await expectRevert(
            swapManagerContract.withdrawERC721Token(
                'TST',      // tokenSymbol
                investor1,  // to
                0,          // tokenId
                true,       // isPodMint
                true,       // isRoyalty
                { from: admin }),
            'SwapManager: cannot withdraw royalty token'
        );
    });

    it('withdrawERC721Token(): should not withdraw ERC721 tokens - cannot withdraw non-royalty token', async () => {
        await expectRevert(
            swapManagerContract.withdrawERC721Token(
                'TST',      // tokenSymbol
                investor1,  // to
                0,          // tokenId
                true,       // isPodMint
                false,      // isRoyalty
                { from: admin }),
            'SwapManager: cannot withdraw non royalty token'
        );
    });

    it('withdrawERC721Token(): should not withdraw ERC721 tokens - non existing standard token', async () => {
        await expectRevert(
            swapManagerContract.withdrawERC721Token(
                'TST',      // tokenSymbol
                investor1,  // to
                1,          // tokenId
                false,      // isPodMint
                false,      // isRoyalty
                { from: admin }),
            'ERC721: owner query for nonexistent token'
        );
    });

    it('withdrawERC721Token(): should not withdraw ERC721 tokens - cannot withdraw standard token', async () => {
        await expectRevert(
            swapManagerContract.withdrawERC721Token(
                'TST',      // tokenSymbol
                investor1,  // to
                0,          // tokenId
                false,      // isPodMint
                false,      // isRoyalty
                { from: admin }),
            'SwapManager: cannot withdraw non standard token'
        );
    });

    it('withdrawERC721Token(): should mint royalty token', async () => {
        // Create 'TST2' contract through PodERC721 factory
        await podERC721RoyaltyFactory.createPod(
            1,              // podId
            'Test Token 2', // podTokenName
            'TST2',         // podTokenSymbol
            'ipfs://test',  // baseURI
            2,              // royaltyAmount
            creator,        // creator
            { from: admin });
        const newPodERC721address = await podERC721RoyaltyFactory.getPodAddressBySymbol('TST2');

        // Mint 'TST2' token
        await podERC721RoyaltyFactory.mintPodTokenBySymbol('TST2', newPodERC721address, { from: admin });
        const newPodERC721 = await IERC721.at(newPodERC721address);
        const balancePodBefore = await newPodERC721.balanceOf(investor1);

        // Withdraw 'TST2' token
        const txReceipt = await swapManagerContract.withdrawERC721Token(
            'TST2',     // tokenSymbol
            investor1,  // to
            0,          // tokenId (not checked when minting)
            true,       // isPodMint
            true,       // isRoyalty
            { from: admin });
        const balancePodAfter = await newPodERC721.balanceOf(investor1);

        assert(balancePodBefore.toString() === '0', 'Swap balance should be 0');
        assert(balancePodAfter.toString() === '1', 'Swap balance should be 1');

        expectEvent(txReceipt, 'WithdrawERC721Token', {
            //tokenSymbol: 'UNI',
            to: investor1,
            tokenId: new BN(0),
        });
    });

    it('withdrawERC721Token(): should mint non-royalty token', async () => {
        // Create 'TST2' contract through PodERC721 factory
        await podERC721Factory.createPod(
            1,
            'Test Token 2',
            'TST2',
            'ipfs://test',
            { from: admin });
        const newPodERC721address = await podERC721Factory.getPodAddressById(1);

        // Mint 'TST2' token
        await podERC721Factory.mintPodTokenById(1, newPodERC721address, { from: admin });
        const newPodERC721 = await IERC721.at(newPodERC721address);
        const balancePodBefore = await newPodERC721.balanceOf(investor1);

        // Withdraw 'TST2' token
        const txReceipt = await swapManagerContract.withdrawERC721Token(
            'TST2',
            investor1,
            1,
            true,
            false,
            { from: admin });
        const balancePodAfter = await newPodERC721.balanceOf(investor1);

        assert(balancePodBefore.toString() === '0', 'Swap balance should be 0');
        assert(balancePodAfter.toString() === '1', 'Swap balance should be 1');

        expectEvent(txReceipt, 'WithdrawERC721Token', {
            //tokenSymbol: 'UNI',
            to: investor1,
            tokenId: new BN(1),
        });
    });

    it('withdrawERC721Token(): should transfer standard token', async () => {
        await fakeERC721.approve(swapManagerContract.address, 0, { from: investor1 });
        await swapManagerContract.depositERC721Token('TST', 0, { from: investor1 });

        const balanceSwapBefore = await fakeERC721.balanceOf(swapManagerContract.address);

        // Withdraw 'TST2' token
        const txReceipt = await swapManagerContract.withdrawERC721Token(
            'TST',      // tokenSymbol
            investor1,  // to
            0,          // tokenId
            false,      // isPodMint
            false,      // isRoyalty
            { from: admin })

        const balanceSwapAfter = await fakeERC721.balanceOf(swapManagerContract.address);

        assert(balanceSwapBefore.toString() === '1', 'Swap balance should be 1');
        assert(balanceSwapAfter.toString() === '0', 'Swap balance should be 0');

        expectEvent(txReceipt, 'WithdrawERC721Token', {
            //tokenSymbol: 'UNI',
            to: investor1,
            tokenId: new BN(0),
        });
    });
});