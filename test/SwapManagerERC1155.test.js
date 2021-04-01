const { expectRevert, expectEvent, BN } = require('@openzeppelin/test-helpers');
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
const FakeERC1155 = artifacts.require('PRIVIPodERC1155Token');
const IERC1155 = artifacts.require('IERC1155');

contract('SwapManager for ERC1155 tokens', (accounts) => {
    let swapManagerContract;
    let bridgeManagerContract;
    let podERC20Factory;
    let podERC721Factory;
    let podERC721RoyaltyFactory;
    let podERC1155Factory;
    let podERC1155RoyaltyFactory;
    let fakeERC1155;
    const [admin, investor1, hacker, creator] = accounts
    const NO_DATA = web3.utils.fromAscii('nothing');

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
        await podERC1155Factory.assignRoleSwapManager(swapManagerContract.address, { from: admin });
        await podERC1155RoyaltyFactory.assignRoleSwapManager(swapManagerContract.address, { from: admin });

        // Fake ERC1155 contract
        fakeERC1155 = await FakeERC1155.new(
            'ipfs://TST',   // uri
            admin,          // factory
            { from: admin }
        );

        // Mint TST token to investor1
        await fakeERC1155.mint(
            investor1,  // to
            0,          // id
            1000,       // amount
            NO_DATA,    // data
            { from: admin }
        );

        // Register TST token in Bridge
        await bridgeManagerContract.registerTokenERC1155(
            'Token Test',           // tokenName
            'ipfs://TST',           // tokenURI
            fakeERC1155.address,    // tokenContractAddress
        );
    });

    /* ********************************************************************** 
     *                         CHECK depositERC1155Token() 
     * **********************************************************************/

    it('depositERC1155Token(): should not deposit ERC1155 tokens - not registered', async () => {
        await expectRevert(
            swapManagerContract.depositERC1155Token(
                'NO_URI',       // tokenURI
                0,              // tokenId
                15,             // amount
                NO_DATA,        // data
                { from: investor1 }),
            'SwapManager: token is not registered on BridgeManager'
        );
    });


    it('depositERC1155Token(): should not deposit ERC1155 tokens - not approved yet', async () => {
        await expectRevert(
            swapManagerContract.depositERC1155Token(
                'ipfs://TST',   // tokenURI
                0,              // tokenId
                15,             // amount
                NO_DATA,        // data
                { from: investor1 }),
            'SwapManager: user did not grant aprove yet'
        );
    });

    it('depositERC1155Token(): should not deposit ERC1155 tokens - insufficient balance', async () => {
        await fakeERC1155.setApprovalForAll(swapManagerContract.address, investor1, { from: investor1 });
        await expectRevert(
            swapManagerContract.depositERC1155Token(
                'ipfs://TST',   // tokenURI
                0,              // tokenId
                150000,         // amount
                NO_DATA,        // data
                { from: investor1 }),
            `ERC1155: insufficient balance for transfer`
        );
    });

    it('depositERC1155Token(): should deposit ERC1155 tokens', async () => {
        const balanceSwapBefore = await fakeERC1155.balanceOf(swapManagerContract.address, 0);

        await fakeERC1155.setApprovalForAll(swapManagerContract.address, investor1, { from: investor1 });
        await swapManagerContract.depositERC1155Token(
            'ipfs://TST',   // tokenURI
            0,              // tokenId
            15,             // amount
            NO_DATA,        // data
            { from: investor1 }
        );

        const balanceSwapAfter = await fakeERC1155.balanceOf(swapManagerContract.address, 0);

        assert(balanceSwapBefore.toString() === '0', 'Swap balance should be 0');
        assert(balanceSwapAfter.toString() === '15', 'Swap balance should be 15');
    });

    /* ********************************************************************** 
     *                         CHECK withdrawERC1155Token() 
     * **********************************************************************/

    it('withdrawERC1155Token(): should not withdraw ERC1155 tokens - TRANSFER_ROLE only', async () => {
        await expectRevert(
            swapManagerContract.withdrawERC1155Token(
                'ipfs://TST',   // tokenURI
                investor1,      // to
                0,              // tokenId
                15,             // amount
                NO_DATA,        // data
                false,          // isPodMint
                false,          // isRoyalty
                { from: hacker }),
            'SwapManager: must have TRANSFER_ROLE to withdraw token'
        );
    });

    it('withdrawERC1155Token(): should not withdraw ERC1155 tokens - insufficient funds / non existing std token', async () => {
        await expectRevert(
            swapManagerContract.withdrawERC1155Token(
                'ipfs://TST',   // tokenURI
                investor1,      // to
                0,              // tokenId
                15,             // amount
                NO_DATA,        // data
                false,          // isPodMint
                false,          // isRoyalty
                { from: admin }),
            'SwapManager: insufficient funds in PRIVI SwapManager'
        );
    });

    it('withdrawERC1155Token(): should not withdraw ERC1155 tokens - cannot withdraw royalty token', async () => {
        await expectRevert(
            swapManagerContract.withdrawERC1155Token(
                'ipfs://NONE',  // tokenURI
                investor1,      // to
                0,              // tokenId
                15,             // amount
                NO_DATA,        // data
                true,          // isPodMint
                true,          // isRoyalty
                { from: admin }),
            'SwapManager: cannot withdraw any amount (royalty)'
        );
    });

    it('withdrawERC1155Token(): should not withdraw ERC1155 tokens - cannot withdraw non-royalty token', async () => {
        await expectRevert(
            swapManagerContract.withdrawERC1155Token(
                'ipfs://NONE',  // tokenURI
                investor1,      // to
                0,              // tokenId
                15,             // amount
                NO_DATA,        // data
                true,           // isPodMint
                false,          // isRoyalty
                { from: admin }),
            'SwapManager: cannot withdraw any amount (non royalty)'
        );
    });

    it('withdrawERC1155Token(): should mint royalty token', async () => {
        // Create 'TST2' contract through PodERC1155 factory
        await podERC1155RoyaltyFactory.createPod(
            'ipfs://TST2',  // baseURI
            2,              // royaltyAmount
            creator,        // creator
            { from: admin });
        const newPodERC1155address = await podERC1155RoyaltyFactory.getPodAddressByUri('ipfs://TST2');
        const newPodERC1155 = await IERC1155.at(newPodERC1155address);

        // Check investor's balance before the withdrawal
        const balancePodBefore = await newPodERC1155.balanceOf(
            investor1,      // owner
            0               // id
        );

        // // Withdraw 'TST2' token
        const txReceipt = await swapManagerContract.withdrawERC1155Token(
            'ipfs://TST2',  // tokenSymbol
            investor1,      // to
            0,              // tokenId (not checked when minting)
            15,             // amount
            NO_DATA,        // data
            true,           // isPodMint
            true,           // isRoyalty
            { from: admin }
        );

        // Check investor's balance after the withdrawal
        const balancePodAfter = await newPodERC1155.balanceOf(
            investor1,      // owner
            0               // id
        );

        assert(balancePodBefore.toString() === '0', 'Swap balance should be 0');
        assert(balancePodAfter.toString() === '15', 'Swap balance should be 15');

        expectEvent(txReceipt, 'WithdrawERC1155Token', {
            //tokenSymbol: 'UNI',
            to: investor1,
            tokenId: new BN(0),
            amount: new BN(15),
        });
    });

    it('withdrawERC1155Token(): should mint non-royalty token', async () => {
        // Create 'TST2' contract through PodERC1155 factory
        await podERC1155Factory.createPod(
            'ipfs://TST2',  // baseURI
            { from: admin });
        const newPodERC1155address = await podERC1155Factory.getPodAddressByUri('ipfs://TST2');
        const newPodERC1155 = await IERC1155.at(newPodERC1155address);

        // Check investor's balance before the withdrawal
        const balancePodBefore = await newPodERC1155.balanceOf(
            investor1,      // owner
            0               // id
        );

        // Withdraw 'TST2' token
        const txReceipt = await swapManagerContract.withdrawERC1155Token(
            'ipfs://TST2',  // tokenURI
            investor1,      // to
            0,              // tokenId
            15,             // amount
            NO_DATA,        // data
            true,           // isPodMint
            false,          // isRoyalty
            { from: admin }
        );

        // Check investor's balance after the withdrawal
        const balancePodAfter = await newPodERC1155.balanceOf(
            investor1,      // owner
            0               // id
        );

        assert(balancePodBefore.toString() === '0', 'Swap balance should be 0');
        assert(balancePodAfter.toString() === '15', 'Swap balance should be 15');

        expectEvent(txReceipt, 'WithdrawERC1155Token', {
            //tokenSymbol: 'UNI',
            to: investor1,
            tokenId: new BN(0),
            amount: new BN(15),
        });
    });

    it('withdrawERC1155Token(): should transfer standard token', async () => {
        // Approve SwapManager to deposit a TST token from investor address to SwapManager contract
        await fakeERC1155.setApprovalForAll(swapManagerContract.address, true, { from: investor1 });
        await swapManagerContract.depositERC1155Token(
            'ipfs://TST',   // tokenURI
            0,              // tokenId
            150,            // amount
            NO_DATA,        // data
            { from: investor1 }
        );
        
        // Check investor's balance before the withdrawal
        const balanceSwapBefore = await fakeERC1155.balanceOf(
            investor1,      // owner
            0               // id
        );

        // Withdraw 'TST2' token
        const txReceipt = await swapManagerContract.withdrawERC1155Token(
            'ipfs://TST',   // tokenSymbol
            investor1,      // to
            0,              // tokenId
            100,            // amount
            NO_DATA,        // data
            false,          // isPodMint
            false,          // isRoyalty
            { from: admin }
        );

        // Check investor's balance after the withdrawal
        const balanceSwapAfter = await fakeERC1155.balanceOf(
            investor1,      // owner
            0               // id
        );

        assert(balanceSwapBefore.toString() === '850', 'Swap balance should be 850');
        assert(balanceSwapAfter.toString() === '950', 'Swap balance should be 950');

        expectEvent(txReceipt, 'WithdrawERC1155Token', {
            //tokenSymbol: 'UNI',
            to: investor1,
            tokenId: new BN(0),
            amount: new BN(100),
        });
    });
});
