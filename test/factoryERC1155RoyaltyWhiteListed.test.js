const { expectRevert, expectEvent } = require('@openzeppelin/test-helpers');
const assert = require('assert');

// Artifacts
const BridgeManager = artifacts.require('BridgeManager');
const PodERC1155RoyaltyFactory = artifacts.require('PRIVIPodERC1155RoyaltyFactoryWhiteListed');
const PodERC1155RoyaltyToken = artifacts.require('PRIVIPodERC1155RoyaltyToken');

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

const getTxCost = async (txReceipt) => {
    const txGasPrice = new BN((await web3.eth.getTransaction(txReceipt.tx)).gasPrice);
    const txGasConsumed = new BN(txReceipt.receipt.gasUsed);
    return txGasPrice.mul(txGasConsumed);
};

contract('PRIVI Pod Factory ERC1155Royalty', (accounts) => {
    let bridgeManagerContract;
    let podERC1155RoyaltyFactory;
    const NO_DATA = web3.utils.fromAscii('nothing');

    const [admin, investor1, creator1, creator2, buyer1, seller1, hacker] = accounts;

    beforeEach(async () => {
        // Bridge contract
        bridgeManagerContract = await BridgeManager.new({ from: admin });

        // Factory contracts
        podERC1155RoyaltyFactory = await PodERC1155RoyaltyFactory.new(bridgeManagerContract.address, { from: admin });

        // TST Token creation
        await podERC1155RoyaltyFactory.createPod(
            'ipfs://test0', // uri
            '6',
            2,              // royalty amount
            creator1,       // pod creator
            { from: admin });
    });

    /* ********************************************************************** 
    *                         CHECK assignRoleSwapManager() 
    * **********************************************************************/

    it('assignRoleSwapManager(): should not assign role - only admin', async () => {
        await expectRevert(
            podERC1155RoyaltyFactory.assignRoleSwapManager(bridgeManagerContract.address, { from: hacker }),
            'Ownable: caller is not the moderator'
        );
    });

    /* ********************************************************************** 
     *                         CHECK createPod() 
     * **********************************************************************/


    it('createPod(): should not create POD - pod id already exists', async () => {
        await expectRevert(
            podERC1155RoyaltyFactory.createPod(
                'ipfs://test0', // pod uri
                '6',
                2,              // royalty amount
                creator1,       // pod creator
                { from: admin }
            ),
            'PRIVIPodERC1155RoyaltyFactory: Pod already exists'
        );
    });

    it('createPod(): should not create POD - empty name', async () => {
        await expectRevert(
            podERC1155RoyaltyFactory.createPod(
                '',             // pod uri
                '7',
                2,              // royalty amount
                creator1,       // pod creator
                { from: admin }
            ),
            `BridgeManager: token name and symbol can't be empty`
        );
    });

    it('createPod(): should not create POD - caller is not the admin', async () => {
        await expectRevert(
            podERC1155RoyaltyFactory.createPod(
                'ipfs://test4',             // pod uri
                '4',
                2,              // royalty amount
                creator1,       // pod creator
                { from: hacker }
            ),
            `Ownable: caller is not the moderator`
        );
    });

    it('createPod(): should create POD - admin add as moderator', async () => {
        await podERC1155RoyaltyFactory.addModerator(hacker, {from: admin})
        await podERC1155RoyaltyFactory.createPod(
            'ipfs://test4',             // pod uri
            '4',
            2,              // royalty amount
            creator1,       // pod creator
            { from: hacker }
        );
    });

    it('createPod(): should create POD', async () => {
        const tokensBefore = await podERC1155RoyaltyFactory.totalPodCreated();

        const txReceipt = await podERC1155RoyaltyFactory.createPod(
            'ipfs://test1', // pod uri
            '8',
            2,              // royalty amount
            creator1,       // pod creator
            { from: admin }
        );

        const podAddress = await podERC1155RoyaltyFactory.getPodAddressByUri('ipfs://test1');
        const tokensAfter = await podERC1155RoyaltyFactory.totalPodCreated();

        assert(tokensBefore.toString() === '1', 'number of tokens before should be 1');
        assert(tokensAfter.toString() === '2', 'number of tokens after should be 2');
        assert(podAddress !== ZERO_ADDRESS, 'pod token address should not be 0');

        expectEvent(txReceipt, 'PodCreated', {
            uri: web3.utils.keccak256('ipfs://test1'),
            podAddress: podAddress,
        });
    });

    it('createPod(): should assign parent Factory to POD token contract', async () => {
        await podERC1155RoyaltyFactory.createPod(
            'ipfs://test2', // pod uri
            '9',
            2,              // royalty amount
            creator1,       // pod creator
            { from: admin }
        );

        const podAddress = await podERC1155RoyaltyFactory.getPodAddressByUri('ipfs://test2');
        const erc1155RoyaltyTokenContract = await PodERC1155RoyaltyToken.at(podAddress);
        const podFactoryAddress = await erc1155RoyaltyTokenContract.parentFactory();

        assert(podERC1155RoyaltyFactory.address === podFactoryAddress, 'factory address should match');
    });


    /* ********************************************************************** 
     *                         CHECK createMultiCreatorPod() 
     * **********************************************************************/


    it('createMultiCreatorPod(): should not create POD - pod id already exists', async () => {
        await expectRevert(
            podERC1155RoyaltyFactory.createMultiCreatorPod(
                'ipfs://test0',         // pod uri
                '10',
                10,                     // royalty amount
                [50, 50],               // royaltyShares
                [creator1, creator2],   // pod creators
                { from: admin }
            ),
            'PRIVIPodERC1155RoyaltyFactory: Pod already exists'
        );
    });

    it('createMultiCreatorPod(): should not create POD - empty name', async () => {
        await expectRevert(
            podERC1155RoyaltyFactory.createMultiCreatorPod(
                '',                     // pod uri
                '11',
                2,                      // royalty amount
                [50, 50],               // royaltyShares
                [creator1, creator2],   // pod creators
                { from: admin }
            ),
            `BridgeManager: token name and symbol can't be empty`
        );
    });

    // TODO: try different array ranges
    it('createMultiCreatorPod(): should not create POD - num. of creators and shares not aligned', async () => {
        await expectRevert(
            podERC1155RoyaltyFactory.createMultiCreatorPod(
                'ipfs://test1',         // pod uri
                '12',
                2,                      // royalty amount
                [50, 25, 25],           // royaltyShares
                [creator1, creator2],   // pod creators
                { from: admin }
            ),
            `MultiCreatorNftManager: Creators and Shares are not of same length`
        );
    });

    it('createMultiCreatorPod(): should create POD', async () => {
        const tokensBefore = await podERC1155RoyaltyFactory.totalPodCreated();

        const txReceipt = await podERC1155RoyaltyFactory.createMultiCreatorPod(
            'ipfs://test1',         // pod uri
            '13',
            2,                      // royalty amount
            [50, 50],               // royaltyShares
            [creator1, creator2],   // pod creators
            { from: admin }
        );

        const podAddress = await podERC1155RoyaltyFactory.getPodAddressByUri('ipfs://test1');
        const tokensAfter = await podERC1155RoyaltyFactory.totalPodCreated();

        assert(tokensBefore.toString() === '1', 'number of tokens before should be 1');
        assert(tokensAfter.toString() === '2', 'number of tokens after should be 2');
        assert(podAddress !== ZERO_ADDRESS, 'pod token address should not be 0');

        expectEvent(txReceipt, 'PodCreated', {
            uri: web3.utils.keccak256('ipfs://test1'),
            podAddress: podAddress,
        });
    });

    it('createMultiCreatorPod(): should assign parent Factory to POD token contract', async () => {
        await podERC1155RoyaltyFactory.createMultiCreatorPod(
            'ipfs://test2',         // pod uri
            '15',
            2,                      // royalty amount
            [50, 50],               // royaltyShares
            [creator1, creator2],   // pod creators
            { from: admin }
        );

        const podAddress = await podERC1155RoyaltyFactory.getPodAddressByUri('ipfs://test2');
        const erc1155RoyaltyTokenContract = await PodERC1155RoyaltyToken.at(podAddress);
        const podFactoryAddress = await erc1155RoyaltyTokenContract.parentFactory();

        assert(podERC1155RoyaltyFactory.address === podFactoryAddress, 'factory address should match');
    });

    /* ********************************************************************** 
    *                         CHECK mintPodTokenByUri() 
    * **********************************************************************/

        it('mintPodTokenByUri(): should not mint POD - missing MODERATOR_ROLE', async () => {
            await expectRevert(
                podERC1155RoyaltyFactory.mintPodTokenByUri(
                    'ipfs://test0', // pod uri
                    investor1,      // to
                    0,              // tokenId
                    100,            // amount
                    NO_DATA,        // data
                    { from: hacker }
                ),
                'Ownable: caller is not the moderator'
            );
        });
    
        it('mintPodTokenByUri(): should not mint POD - cannot be zero address', async () => {
            await expectRevert(
                podERC1155RoyaltyFactory.mintPodTokenByUri(
                    'ipfs://test0', // pod uri
                    ZERO_ADDRESS,   // to
                    0,              // tokenId
                    100,            // amount
                    NO_DATA,        // data
                    { from: admin }
                ),
                'PRIVIPodERC1155RoyaltyFactory: Account address should not be zero'
            );
        });
    
        it('mintPodTokenByUri(): should not mint POD - pod id does not exist', async () => {
            await expectRevert.unspecified(
                podERC1155RoyaltyFactory.mintPodTokenByUri(
                    '',             // pod uri
                    investor1,      // to
                    0,              // tokenId
                    100,            // amount
                    NO_DATA,        // data
                    { from: admin }
                )
            );
        });
    
        it('mintPodTokenByUri(): should not mint POD - amount must be greater than zero', async () => {
            await expectRevert.unspecified(
                podERC1155RoyaltyFactory.mintPodTokenByUri(
                    'ipfs://test3', // pod uri
                    investor1,      // to
                    0,              // tokenId
                    0,              // amount
                    NO_DATA,        // data
                    { from: admin }
                )
            );
        });
    
        it('mintPodTokenByUri(): should mint POD', async () => {
            const podAddress = await podERC1155RoyaltyFactory.getPodAddressByUri('ipfs://test0');
            const erc1155RoyaltyTokenContract = await PodERC1155RoyaltyToken.at(podAddress);
    
            const balanceInvestorBefore = await erc1155RoyaltyTokenContract.balanceOf(investor1, 0);
    
            await podERC1155RoyaltyFactory.mintPodTokenByUri(
                'ipfs://test0', // pod uri
                investor1,      // to
                0,              // tokenId
                100,            // amount
                NO_DATA,        // data
                { from: admin }
            );
    
            const balanceInvestorAfter = await erc1155RoyaltyTokenContract.balanceOf(investor1, 0);
    
            assert(balanceInvestorBefore.toString() === '0', 'investors initial amount should be 0');
            assert(balanceInvestorAfter.toString() === '100', 'investors final amount should be 100');
        });

    /* ********************************************************************** 
     *                         CHECK batchMintPodTokenByUri() 
     * **********************************************************************/

        it('batchMintPodTokenByUri(): should not mint POD - missing MODERATOR_ROLE', async () => {
            await expectRevert(
                podERC1155RoyaltyFactory.batchMintPodTokenByUri(
                    'ipfs://test0', // pod uri
                    investor1,      // to
                    [0],            // tokenId
                    [100],          // amount
                    NO_DATA,        // data
                    { from: hacker }
                ),
                'Ownable: caller is not the moderator'
            );
        });
    
        it('batchMintPodTokenByUri(): should not mint POD - cannot be zero address', async () => {
            await expectRevert(
                podERC1155RoyaltyFactory.batchMintPodTokenByUri(
                    'ipfs://test0', // pod uri
                    ZERO_ADDRESS,   // to
                    [0],            // tokenId
                    [100],          // amount
                    NO_DATA,        // data
                    { from: admin }
                ),
                'PRIVIPodERC1155RoyaltyFactory: Account address should not be zero'
            );
        });
    
        it('batchMintPodTokenByUri(): should not mint POD - pod id does not exist', async () => {
            await expectRevert.unspecified(
                podERC1155RoyaltyFactory.batchMintPodTokenByUri(
                    '',             // pod uri
                    investor1,      // to
                    [0],            // tokenId
                    [100],          // amount
                    NO_DATA,        // data
                    { from: admin }
                )
            );
        });
    
        it('batchMintPodTokenByUri(): should not mint POD - amount must be greater than zero', async () => {
            await expectRevert.unspecified(
                podERC1155RoyaltyFactory.batchMintPodTokenByUri(
                    'ipfs://test3', // pod uri
                    investor1,      // to
                    [0,1],          // tokenId
                    [0,5],          // amount
                    NO_DATA,        // data
                    { from: admin }
                )
            );
        });
    
        it('batchMintPodTokenByUri(): should mint POD', async () => {
            const podAddress = await podERC1155RoyaltyFactory.getPodAddressByUri('ipfs://test0');
            const erc1155RoyaltyTokenContract = await PodERC1155RoyaltyToken.at(podAddress);
    
            const balanceInvestorBefore = await erc1155RoyaltyTokenContract.balanceOf(investor1, 1);
    
            await podERC1155RoyaltyFactory.batchMintPodTokenByUri(
                'ipfs://test0', // pod uri
                investor1,      // to
                [0,1],          // tokenId
                [15,25],        // amount
                NO_DATA,        // data
                { from: admin }
            );
    
            const balanceInvestorAfter = await erc1155RoyaltyTokenContract.balanceOf(investor1, 1);
    
            assert(balanceInvestorBefore.toString() === '0', 'investors initial amount should be 0');
            assert(balanceInvestorAfter.toString() === '25', 'investors final amount should be 25');
        });
});
