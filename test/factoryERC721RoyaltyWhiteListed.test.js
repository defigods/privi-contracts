const { expectRevert, expectEvent, BN, balance, ether } = require('@openzeppelin/test-helpers');
const assert = require('assert');

// Artifacts
const BridgeManager = artifacts.require('BridgeManager');
const PodERC721RoyaltyFactory = artifacts.require('PRIVIPodERC721RoyaltyFactoryWhiteListed');
const PodERC721RoyaltyToken = artifacts.require('PRIVIPodERC721RoyaltyToken');

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

const getTxCost = async (txReceipt) => {
    const txGasPrice = new BN((await web3.eth.getTransaction(txReceipt.tx)).gasPrice);
    const txGasConsumed = new BN(txReceipt.receipt.gasUsed);
    return txGasPrice.mul(txGasConsumed);
};

contract('PRIVI Pod Factory ERC721Royalty', (accounts) => {
    let bridgeManagerContract;
    let podERC721RoyaltyFactory;
    let erc721TokenContract;

    const [admin, investor1, creator1, creator2, buyer1, seller1, hacker] = accounts

    beforeEach(async () => {
        // Bridge contract
        bridgeManagerContract = await BridgeManager.new({ from: admin });

        // Factory contracts
        podERC721RoyaltyFactory = await PodERC721RoyaltyFactory.new(bridgeManagerContract.address, { from: admin });

        // TST Token creation
        await podERC721RoyaltyFactory.createPod(
            '0',            // pod id
            'Test Token0',  // pod name
            'TST0',         // pod symbol
            'ipfs://test',  // baseURI
            2,              // royaltyAmount (%)
            creator1,       // creator
            { from: admin });

        const podAddress = await podERC721RoyaltyFactory.getPodAddressBySymbol('TST0');
        erc721TokenContract = await PodERC721RoyaltyToken.at(podAddress);
    });

    /* ********************************************************************** 
    *                         CHECK assignRoleSwapManager() 
    * **********************************************************************/

    it('assignRoleSwapManager(): should not assign role - only admin', async () => {
        await expectRevert(
            podERC721RoyaltyFactory.assignRoleSwapManager(bridgeManagerContract.address, { from: hacker }),
            'Ownable: caller is not the moderator'
        );
    });

    /* ********************************************************************** 
     *                         CHECK createPod() 
     * **********************************************************************/

    it('createPod(): should not create POD - pod id already exists', async () => {
        await expectRevert(
            podERC721RoyaltyFactory.createPod(
                '0',            // pod id
                'Test Token1',  // pod name
                'TST1',         // pod symbol
                'ipfs://test1', // pod url
                2,              // royaltyAmount
                creator1,       // creator
                { from: admin }
            ),
            'PRIVIPodERC721RoyaltyFactory: Pod id already exists'
        );
    });

    it('createPod(): should not create POD - pod symbol already exists', async () => {
        await expectRevert(
            podERC721RoyaltyFactory.createPod(
                '1',            // pod id
                'Test Token1',  // pod name
                'TST0',         // pod symbol
                'ipfs://test1', // pod url
                2,              // royaltyAmount
                creator1,       // creator
                { from: admin }
            ),
            'PRIVIPodERC721RoyaltyFactory: Pod symbol already exists'
        );
    });

    it('createPod(): should not create POD - empty name', async () => {
        await expectRevert(
            podERC721RoyaltyFactory.createPod(
                '1',            // pod id
                '',             // pod name
                'TST1',         // pod symbol
                'ipfs://test1', // pod url
                2,              // royaltyAmount
                creator1,       // creator
                { from: admin }
            ),
            `BridgeManager: token name and symbol can't be empty`
        );
    });

    it('createPod(): should not create POD - empty symbol', async () => {
        await expectRevert(
            podERC721RoyaltyFactory.createPod(
                '1',            // pod id
                'Test Token1',  // pod name
                '',             // pod symbol
                'ipfs://test1', // pod url
                2,              // royaltyAmount
                creator1,       // creator
                { from: admin }
            ),
            `BridgeManager: token name and symbol can't be empty`
        );
    });

    it('createPod(): should not create POD - symbol too long', async () => {
        await expectRevert(
            podERC721RoyaltyFactory.createPod(
                '1',            // pod id
                'Test Token1',  // pod name
                'THIS_SYMBOL_SHOULD_HAVE_A_LENGTH_LOWER_THAN_TWENTY_FIVE', // pod symbol
                'ipfs://test1', // pod url
                2,              // royaltyAmount
                creator1,       // creator
                { from: admin }
            ),
            `BridgeManager: token Symbol too long`
        );
    });

    it('createPod(): should not create POD - caller is not the moderator', async () => {
        await expectRevert(
            podERC721RoyaltyFactory.createPod(
                '4',            // pod id
                'Test Token4',  // pod name
                'TST4', // pod symbol
                'ipfs://test4', // pod url
                2,              // royaltyAmount
                creator1,       // creator
                { from: hacker }
            ),
            `Ownable: caller is not the moderator`
        );
    });

    it('createPod(): should create POD - admin as a moderator', async () => {
        await podERC721RoyaltyFactory.addModerator(hacker, {from: admin});
        await podERC721RoyaltyFactory.createPod(
            '4',            // pod id
            'Test Token4',  // pod name
            'TST4', // pod symbol
            'ipfs://test4', // pod url
            2,              // royaltyAmount
            creator1,       // creator
            { from: hacker }
        );
    });

    it('createPod(): should create POD', async () => {
        const tokensBefore = await podERC721RoyaltyFactory.getTotalTokenCreated();

        const txReceipt = await podERC721RoyaltyFactory.createPod(
            '1',            // pod id
            'Test Token1',  // pod name
            'TST1',         // pod symbol
            'ipfs://test1', // pod url
            2,              // royaltyAmount
            creator1,       // creator
            { from: admin }
        );

        const podAddress = await podERC721RoyaltyFactory.getPodAddressById('1');
        const tokensAfter = await podERC721RoyaltyFactory.getTotalTokenCreated();

        assert(tokensBefore.toString() === '1', 'number of tokens before should be 1');
        assert(tokensAfter.toString() === '2', 'number of tokens after should be 2');
        assert(podAddress !== ZERO_ADDRESS, 'pod token address should not be 0');

        expectEvent(txReceipt, 'PodCreated', {
            podId: web3.utils.keccak256('1'),
            podTokenName: 'Test Token1',
            podTokenSymbol: 'TST1'
        });
    });

    it('createPod(): should assign parent Factory to POD token contract', async () => {
        await podERC721RoyaltyFactory.createPod(
            '2',            // pod id
            'Test Token2',  // pod name
            'TST2',         // pod symbol
            'ipfs://test2', // pod url
            2,              // royaltyAmount
            creator1,       // creator
            { from: admin });

        const podAddress = await podERC721RoyaltyFactory.getPodAddressById('2');
        const erc721TokenContract = await PodERC721RoyaltyToken.at(podAddress);
        const podFactoryAddress = await erc721TokenContract.parentFactory();

        assert(podERC721RoyaltyFactory.address === podFactoryAddress, 'factory address should match');
    });


    /* ********************************************************************** 
     *                         CHECK createMultiCreatorPod() 
     * **********************************************************************/

    it('createMultiCreatorPod(): should not create POD - pod id already exists', async () => {
        await expectRevert(
            podERC721RoyaltyFactory.createMultiCreatorPod(
                '0',                    // pod id
                'Test Token1',          // pod name
                'TST1',                 // pod symbol
                'ipfs://test1',         // pod url
                2,                      // royaltyAmount
                [50, 50],               // royaltyShares
                [creator1, creator2],   // creators
                { from: admin }
            ),
            'PRIVIPodERC721RoyaltyFactory: Pod id already exists'
        );
    });

    it('createMultiCreatorPod(): should not create POD - pod symbol already exists', async () => {
        await expectRevert(
            podERC721RoyaltyFactory.createMultiCreatorPod(
                '1',                    // pod id
                'Test Token1',          // pod name
                'TST0',                 // pod symbol
                'ipfs://test1',         // pod url
                2,                      // royaltyAmount
                [50, 50],               // royaltyShares
                [creator1, creator2],   // creators
                { from: admin }
            ),
            'PRIVIPodERC721RoyaltyFactory: Pod symbol already exists'
        );
    });

    it('createMultiCreatorPod(): should not create POD - empty name', async () => {
        await expectRevert(
            podERC721RoyaltyFactory.createMultiCreatorPod(
                '1',                    // pod id
                '',                     // pod name
                'TST1',                 // pod symbol
                'ipfs://test1',         // pod url
                2,                      // royaltyAmount
                [50, 50],               // royaltyShares
                [creator1, creator2],   // creators
                { from: admin }
            ),
            `BridgeManager: token name and symbol can't be empty`
        );
    });

    it('createMultiCreatorPod(): should not create POD - empty symbol', async () => {
        await expectRevert(
            podERC721RoyaltyFactory.createMultiCreatorPod(
                '1',                    // pod id
                'Test Token1',          // pod name
                '',                     // pod symbol
                'ipfs://test1',         // pod url
                2,                      // royaltyAmount
                [50, 50],               // royaltyShares
                [creator1, creator2],   // creators
                { from: admin }
            ),
            `BridgeManager: token name and symbol can't be empty`
        );
    });

    it('createMultiCreatorPod(): should not create POD - symbol too long', async () => {
        await expectRevert(
            podERC721RoyaltyFactory.createMultiCreatorPod(
                '1',                    // pod id
                'Test Token1',          // pod name
                'THIS_SYMBOL_SHOULD_HAVE_A_LENGTH_LOWER_THAN_TWENTY_FIVE', // pod symbol
                'ipfs://test1',         // pod url
                2,                      // royaltyAmount
                [50, 50],               // royaltyShares
                [creator1, creator2],   // creators
                { from: admin }
            ),
            `BridgeManager: token Symbol too long`
        );
    });

    it('createMultiCreatorPod(): should create POD', async () => {
        const tokensBefore = await podERC721RoyaltyFactory.getTotalTokenCreated();

        const txReceipt = await podERC721RoyaltyFactory.createMultiCreatorPod(
            '1',            // pod id
            'Test Token1',  // pod name
            'TST1',         // pod symbol
            'ipfs://test1', // pod url
            2,              // royaltyAmount
            [50, 50],               // royaltyShares
            [creator1, creator2],   // creators
            { from: admin }
        );

        const podAddress = await podERC721RoyaltyFactory.getPodAddressById('1');
        const tokensAfter = await podERC721RoyaltyFactory.getTotalTokenCreated();

        assert(tokensBefore.toString() === '1', 'number of tokens before should be 1');
        assert(tokensAfter.toString() === '2', 'number of tokens after should be 2');
        assert(podAddress !== ZERO_ADDRESS, 'pod token address should not be 0');

        expectEvent(txReceipt, 'PodCreated', {
            podId: web3.utils.keccak256('1'),
            podTokenName: 'Test Token1',
            podTokenSymbol: 'TST1'
        });
    });

    it('createMultiCreatorPod(): should assign parent Factory to POD token contract', async () => {
        await podERC721RoyaltyFactory.createMultiCreatorPod(
            '2',            // pod id
            'Test Token2',  // pod name
            'TST2',         // pod symbol
            'ipfs://test2', // pod url
            2,              // royaltyAmount
            [50, 50],               // royaltyShares
            [creator1, creator2],   // creators
            { from: admin });

        const podAddress = await podERC721RoyaltyFactory.getPodAddressById('2');
        const erc721TokenContract = await PodERC721RoyaltyToken.at(podAddress);
        const podFactoryAddress = await erc721TokenContract.parentFactory();

        assert(podERC721RoyaltyFactory.address === podFactoryAddress, 'factory address should match');
    });

    /* ********************************************************************** 
    *                         CHECK mintPodTokenById() 
    * **********************************************************************/

    it('mintPodTokenById(): should not mint POD - missing MODERATOR_ROLE', async () => {
        await expectRevert(
            podERC721RoyaltyFactory.mintPodTokenById(
                '2',            // pod id
                '5',
                investor1,      // to
                { from: hacker }
            ),
            'Ownable: caller is not the moderator'
        );
    });

    it('mintPodTokenById(): should not mint POD - cannot be zero address', async () => {
        await expectRevert(
            podERC721RoyaltyFactory.mintPodTokenById(
                '2',            // pod id
                '5',
                ZERO_ADDRESS,   // to
                { from: admin }
            ),
            'PRIVIPodERC721RoyaltyFactory: Account address should not be zero'
        );
    });

    it('mintPodTokenById(): should not mint POD - pod id does not exist', async () => {
        await expectRevert.unspecified(
            podERC721RoyaltyFactory.mintPodTokenById(
                'NON_EXISTING', // pod id
                '5',
                investor1,      // to
                { from: admin }
            )
        );
    });

    it('mintPodTokenById(): should mint POD', async () => {
        const podAddress = await podERC721RoyaltyFactory.getPodAddressById('0');
        const erc721TokenContract = await PodERC721RoyaltyToken.at(podAddress);

        const balanceInvestorBefore = await erc721TokenContract.balanceOf(investor1);

        await podERC721RoyaltyFactory.mintPodTokenById(
            '0',            // pod id
            '5',
            investor1,      // to
            { from: admin }
        );

        const balanceInvestorAfter = await erc721TokenContract.balanceOf(investor1);

        assert(balanceInvestorBefore.toString() === '0', 'investors initial value should be 0');
        assert(balanceInvestorAfter.toString() === '1', 'investors final value should be 1');
    });

    /* ********************************************************************** 
     *                         CHECK mintPodTokenBySymbol() 
     * **********************************************************************/

    it('mintPodTokenBySymbol(): should not mint POD - missing MODERATOR_ROLE', async () => {
        await expectRevert(
            podERC721RoyaltyFactory.mintPodTokenBySymbol(
                'TST2',         // pod symbol
                '5',
                investor1,      // to
                { from: hacker }
            ),
            'Ownable: caller is not the moderator'
        );
    });

    it('mintPodTokenBySymbol(): should not mint POD - cannot be zero address', async () => {
        await expectRevert(
            podERC721RoyaltyFactory.mintPodTokenBySymbol(
                'TST2',         // pod symbol
                '5',
                ZERO_ADDRESS,   // to
                { from: admin }
            ),
            'PRIVIPodERC721RoyaltyFactory: Account address should not be zero'
        );
    });

    it('mintPodTokenBySymbol(): should not mint POD - pod id does not exist', async () => {
        await expectRevert.unspecified(
            podERC721RoyaltyFactory.mintPodTokenBySymbol(
                '2',            // pod symbol
                '5',
                investor1,      // to
                { from: admin }
            )
        );
    });

    it('mintPodTokenBySymbol(): should mint POD', async () => {
        const balanceInvestorBefore = await erc721TokenContract.balanceOf(investor1);

        await podERC721RoyaltyFactory.mintPodTokenBySymbol(
            'TST0',         // pod symbol
            '5',
            investor1,      // to
            { from: admin }
        );

        const balanceInvestorAfter = await erc721TokenContract.balanceOf(investor1);

        assert(balanceInvestorBefore.toString() === '0', 'investors initial value should be 0');
        assert(balanceInvestorAfter.toString() === '1', 'investors final value should be 1');
    });

    /* ********************************************************************** 
     *                         CHECK marketSell() 
     * **********************************************************************/

    it('marketSell(): should not trade - nonexistent token', async () => {
        await expectRevert(
            erc721TokenContract.marketSell(
                100,        // sell amount
                0,          // token Id
                seller1,   // from
                buyer1,     // to
                { from: admin, value: 100 }
            ),
            'ERC721: operator query for nonexistent token'
        );
    });

    it('marketSell(): should not trade - caller is not owner or approved', async () => {
        await podERC721RoyaltyFactory.mintPodTokenById(
            '0',            // pod id
            '5',
            seller1,        // to
            { from: admin }
        );

        await expectRevert(
            erc721TokenContract.marketSell(
                100,        // sell amount
                '5',          // token Id
                seller1,    // from
                buyer1,     // to
                { from: hacker, value: 100 }
            ),
            'ERC721: transfer caller is not owner nor approved'
        );
    });

    it('marketSell(): should trade', async () => {
        const balanceCreatorBefore = await balance.current(creator1);
        const balanceSellerBefore = await balance.current(seller1);
        const balanceBuyerBefore = await balance.current(buyer1);

        // Token id 0 is minted
        await podERC721RoyaltyFactory.mintPodTokenById(
            '0',        // pod id
            '5',
            seller1,    // to
            { from: admin }
        );

        // Seller gives transfer approval to buyer
        const txReceiptSeller = await erc721TokenContract.approve(buyer1, '5', { from: seller1 });

        // Token id 0 is sold
        const txReceiptBuyer = await erc721TokenContract.marketSell(
            ether('5'), // sell amount
            '5',          // token Id
            seller1,    // from
            buyer1,     // to
            { from: buyer1, value: ether('5') }
        );

        const balanceCreatorAfter = await balance.current(creator1);

        // Balance of Buyer excluding tx cost
        const txCostSeller = await getTxCost(txReceiptSeller);
        const balanceSellerAfter = BN(await balance.current(seller1)).add(txCostSeller);

        // Balance of Seller excluding tx cost
        const txCostBuyer = await getTxCost(txReceiptBuyer);
        const balanceBuyerAfter = BN(await balance.current(buyer1)).add(txCostBuyer);

        // Logs
        // console.log('Balance creator before:', web3.utils.fromWei(balanceCreatorBefore).toString());
        // console.log('Balance creator after: ', web3.utils.fromWei(balanceCreatorAfter).toString());
        // console.log('Balance seller before:', web3.utils.fromWei(balanceSellerBefore).toString());
        // console.log('Balance seller after: ', web3.utils.fromWei(balanceSellerAfter).toString());
        // console.log('Balance buyer before:', web3.utils.fromWei(balanceBuyerBefore).toString());
        // console.log('Balance buyer after: ', web3.utils.fromWei(balanceBuyerAfter).toString());

        // Creator earns 0,1 ETH royalties
        assert(balanceCreatorBefore.eq(balanceCreatorAfter.sub(ether('0.1'))));

        // Seller earns 5 ETH from sell minus 0.1 ETH royalties to the creator
        assert(balanceSellerBefore.eq((balanceSellerAfter.sub(ether('5'))).add(ether('0.1'))));

        // Buyer spends 5 ETH from the purchase to seller
        assert(balanceBuyerBefore.eq(balanceBuyerAfter.add(ether('5'))));

        expectEvent(txReceiptBuyer, 'RecievedRoyalties', {
            creator: creator1,
            buyer: buyer1,      
            amount: ether('0.1') // (msg.value * royalty amnt) / 100 => (5 * 2) / 100 => 0.1 ETH
        });
    });

});