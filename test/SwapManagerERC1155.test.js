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
            investor1,                          // to
            0,                                  // id
            1000,                               // amount
            web3.utils.fromAscii('nothing'),    // data
            { from: admin }
        );

        // Register TST token in Bridge
        await bridgeManagerContract.registerTokenERC1155(
            'Token Test',           // tokenName
            'ipfs://TST',           // tokenURI
            fakeERC1155.address,    // tokenContractAddress
        );
    });

    /*********** CHECK depositERC1155Token() **************/

    it('depositERC1155Token(): should not deposit ERC1155 tokens - not registered', async () => {
        await expectRevert(
            swapManagerContract.depositERC1155Token(
                'NON_EXISTING_URI',             // tokenURI
                investor1,                      // to
                0,                              // tokenId
                15,                             // amount
                web3.utils.fromAscii('nothing'),// data
                { from: investor1 }),
            'SwapManager: token is not registered on BridgeManager'
        );
    });


    it('depositERC1155Token(): should not deposit ERC1155 tokens - not approved yet', async () => {
        await expectRevert(
            swapManagerContract.depositERC1155Token(
                'ipfs://TST',                   // tokenURI
                investor1,                      // to
                0,                              // tokenId
                15,                             // amount
                web3.utils.fromAscii('nothing'),// data
                { from: investor1 }),
            'SwapManager: user did not grant aprove yet'
        );
    });

    it('depositERC1155Token(): should not deposit ERC1155 tokens - insufficient balance', async () => {
        await fakeERC1155.setApprovalForAll(swapManagerContract.address, investor1, { from: investor1 });
        await expectRevert(
            swapManagerContract.depositERC1155Token(
                'ipfs://TST',                   // tokenURI
                investor1,                      // to
                0,                              // tokenId
                150000,                         // amount
                web3.utils.fromAscii('nothing'),// data
                { from: investor1 }),
            `ERC1155: insufficient balance for transfer`
        );
    });

    it('depositERC1155Token(): should deposit ERC1155 tokens', async () => {
        const balanceSwapBefore = await fakeERC1155.balanceOf(swapManagerContract.address, 0);

        await fakeERC1155.setApprovalForAll(swapManagerContract.address, investor1, { from: investor1 });
        await swapManagerContract.depositERC1155Token(
            'ipfs://TST',                   // tokenURI
            investor1,                      // to
            0,                              // tokenId
            15,                             // amount
            web3.utils.fromAscii('nothing'),// data
            { from: investor1 })

        const balanceSwapAfter = await fakeERC1155.balanceOf(swapManagerContract.address, 0);

        assert(balanceSwapBefore.toString() === '0', 'Swap balance should be 0');
        assert(balanceSwapAfter.toString() === '15', 'Swap balance should be 15');
    });

    /*
        it('depositERC1155Token(): should not deposit ERC1155 tokens - not approved', async () => {
            await expectRevert(
                swapManagerContract.depositERC1155Token('TST', 0, { from: investor1 }),
                'SwapManager: token to be transferred to PRIVI is not yet approved by User'
            );
        });
    
        it('depositERC1155Token(): should deposit ERC1155 tokens', async () => {
            const balanceSwapBefore = await fakeERC1155.balanceOf(swapManagerContract.address);
    
            await fakeERC1155.approve(swapManagerContract.address, 0, { from: investor1 });
            const txReceipt = await swapManagerContract.depositERC1155Token('TST', 0, { from: investor1 });
    
            const balanceSwapAfter = await fakeERC1155.balanceOf(swapManagerContract.address);
    
            assert(balanceSwapBefore.toString() === '0', 'Swap balance should be 0');
            assert(balanceSwapAfter.toString() === '1', 'Swap balance should be 1');
    
            expectEvent(txReceipt, 'depositERC1155Token', {
                //tokenSymbol: 'UNI',
                from: investor1,
                tokenId: new BN(0),
            });
        });
    */
    /*********** CHECK withdrawERC1155Token() **************/
    /*
        it('withdrawERC1155Token(): should not withdraw ERC1155 tokens - TRANSFER_ROLE only', async () => {
            await expectRevert(
                swapManagerContract.withdrawERC1155Token(
                    'TST',      // tokenSymbol
                    investor1,  // to
                    0,          // tokenId
                    false,      // isPodMint
                    false,      // isRoyalty
                    { from: hacker }),
                'SwapManager: must have TRANSFER_ROLE to withdraw token'
            );
        });
    
        it('withdrawERC1155Token(): should not withdraw ERC1155 tokens - cannot withdraw royalty token', async () => {
            await expectRevert(
                swapManagerContract.withdrawERC1155Token(
                    'TST',      // tokenSymbol
                    investor1,  // to
                    0,          // tokenId
                    true,       // isPodMint
                    true,       // isRoyalty
                    { from: admin }),
                'SwapManager: cannot withdraw royalty token'
            );
        });
    
        it('withdrawERC1155Token(): should not withdraw ERC1155 tokens - cannot withdraw non-royalty token', async () => {
            await expectRevert(
                swapManagerContract.withdrawERC1155Token(
                    'TST',      // tokenSymbol
                    investor1,  // to
                    0,          // tokenId
                    true,       // isPodMint
                    false,      // isRoyalty
                    { from: admin }),
                'SwapManager: cannot withdraw non royalty token'
            );
        });
    
        it('withdrawERC1155Token(): should not withdraw ERC1155 tokens - non existing standard token', async () => {
            await expectRevert(
                swapManagerContract.withdrawERC1155Token(
                    'TST',      // tokenSymbol
                    investor1,  // to
                    1,          // tokenId
                    false,      // isPodMint
                    false,      // isRoyalty
                    { from: admin }),
                'ERC1155: owner query for nonexistent token'
            );
        });
    
        it('withdrawERC1155Token(): should not withdraw ERC1155 tokens - cannot withdraw standard token', async () => {
            await expectRevert(
                swapManagerContract.withdrawERC1155Token(
                    'TST',      // tokenSymbol
                    investor1,  // to
                    0,          // tokenId
                    false,      // isPodMint
                    false,      // isRoyalty
                    { from: admin }),
                'SwapManager: cannot withdraw non standard token'
            );
        });
    
        it('withdrawERC1155Token(): should mint royalty token', async () => {
            // Create 'TST2' contract through PodERC1155 factory
            await podERC1155RoyaltyFactory.createPod(
                1,              // podId
                'Test Token 2', // podTokenName
                'TST2',         // podTokenSymbol
                'ipfs://test',  // baseURI
                2,              // royaltyAmount
                creator,        // creator
                { from: admin });
            const newPodERC1155address = await podERC1155RoyaltyFactory.getPodAddressBySymbol('TST2');
    
            // Mint 'TST2' token
            await podERC1155RoyaltyFactory.mintPodTokenBySymbol('TST2', newPodERC1155address, { from: admin });
            const newPodERC1155 = await IERC1155.at(newPodERC1155address);
            const balancePodBefore = await newPodERC1155.balanceOf(investor1);
    
            // Withdraw 'TST2' token
            const txReceipt = await swapManagerContract.withdrawERC1155Token(
                'TST2',     // tokenSymbol
                investor1,  // to
                0,          // tokenId (not checked when minting)
                true,       // isPodMint
                true,       // isRoyalty
                { from: admin });
            const balancePodAfter = await newPodERC1155.balanceOf(investor1);
    
            assert(balancePodBefore.toString() === '0', 'Swap balance should be 0');
            assert(balancePodAfter.toString() === '1', 'Swap balance should be 1');
    
            expectEvent(txReceipt, 'withdrawERC1155Token', {
                //tokenSymbol: 'UNI',
                to: investor1,
                tokenId: new BN(0),
            });
        });
    
        it('withdrawERC1155Token(): should mint non-royalty token', async () => {
            // Create 'TST2' contract through PodERC1155 factory
            await podERC1155Factory.createPod(
                1,
                'Test Token 2',
                'TST2',
                'ipfs://test',
                { from: admin });
            const newPodERC1155address = await podERC1155Factory.getPodAddressById(1);
    
            // Mint 'TST2' token
            await podERC1155Factory.mintPodTokenById(1, newPodERC1155address, { from: admin });
            const newPodERC1155 = await IERC1155.at(newPodERC1155address);
            const balancePodBefore = await newPodERC1155.balanceOf(investor1);
    
            // Withdraw 'TST2' token
            const txReceipt = await swapManagerContract.withdrawERC1155Token(
                'TST2',
                investor1,
                1,
                true,
                false,
                { from: admin });
            const balancePodAfter = await newPodERC1155.balanceOf(investor1);
    
            assert(balancePodBefore.toString() === '0', 'Swap balance should be 0');
            assert(balancePodAfter.toString() === '1', 'Swap balance should be 1');
    
            expectEvent(txReceipt, 'withdrawERC1155Token', {
                //tokenSymbol: 'UNI',
                to: investor1,
                tokenId: new BN(1),
            });
        });
    
        it('withdrawERC1155Token(): should transfer standard token', async () => {
            await fakeERC1155.approve(swapManagerContract.address, 0, { from: investor1 });
            await swapManagerContract.depositERC1155Token('TST', 0, { from: investor1 });
    
            const balanceSwapBefore = await fakeERC1155.balanceOf(swapManagerContract.address);
    
            // Withdraw 'TST2' token
            const txReceipt = await swapManagerContract.withdrawERC1155Token(
                'TST',      // tokenSymbol
                investor1,  // to
                0,          // tokenId
                false,      // isPodMint
                false,      // isRoyalty
                { from: admin })
    
            const balanceSwapAfter = await fakeERC1155.balanceOf(swapManagerContract.address);
    
            assert(balanceSwapBefore.toString() === '1', 'Swap balance should be 1');
            assert(balanceSwapAfter.toString() === '0', 'Swap balance should be 0');
    
            expectEvent(txReceipt, 'withdrawERC1155Token', {
                //tokenSymbol: 'UNI',
                to: investor1,
                tokenId: new BN(0),
            });
        });
    */
});