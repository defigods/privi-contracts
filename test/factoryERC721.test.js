const { expectRevert, expectEvent, BN } = require('@openzeppelin/test-helpers');
const assert = require('assert');

// Artifacts
const BridgeManager = artifacts.require('BridgeManager');
const PodERC721Factory = artifacts.require('PRIVIPodERC721Factory');
const PodERC721Token = artifacts.require('PRIVIPodERC721Token');

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

contract('PRIVI Pod Factory ERC721', (accounts) => {
    let bridgeManagerContract;
    let podERC721Factory;

    const [admin, investor1, hacker] = accounts

    beforeEach(async () => {
        // Bridge contract
        bridgeManagerContract = await BridgeManager.new({ from: admin });

        // Factory contracts
        podERC721Factory = await PodERC721Factory.new(bridgeManagerContract.address, { from: admin });

        // TST Token creation
        await podERC721Factory.createPod('0', 'Test Token0', 'TST0', 'ipfs://test', { from: admin });
    });

    /* ********************************************************************** 
    *                         CHECK assignRoleSwapManager() 
    * **********************************************************************/

    it('assignRoleSwapManager(): should not assign role - only admin', async () => {
        await expectRevert(
            podERC721Factory.assignRoleSwapManager(bridgeManagerContract.address, { from: hacker }),
            'PRIVIPodERC721Factory: must have MODERATOR_ROLE to assign SwapManager address'
        );
    });

    /* ********************************************************************** 
     *                         CHECK createPod() 
     * **********************************************************************/

    it('createPod(): should not create POD - pod id already exists', async () => {
        await expectRevert(
            podERC721Factory.createPod(
                '0',            // pod id
                'Test Token1',  // pod token name
                'TST1',         // pod symbol
                'ipfs://test1', // pod url
                { from: admin }
            ),
            'PRIVIPodERC721Factory: Pod id already exists'
        );
    });

    it('createPod(): should not create POD - pod symbol already exists', async () => {
        await expectRevert(
            podERC721Factory.createPod(
                '1',            // pod id
                'Test Token1',  // pod token name
                'TST0',         // pod symbol
                'ipfs://test1', // pod url
                { from: admin }
            ),
            'PRIVIPodERC721Factory: Pod symbol already exists'
        );
    });

    it('createPod(): should not create POD - empty name', async () => {
        await expectRevert(
            podERC721Factory.createPod(
                '1',            // pod id
                '',             // pod token name
                'TST1',         // pod symbol
                'ipfs://test1', // pod url
                { from: admin }
            ),
            `BridgeManager: token name and symbol can't be empty`
        );
    });

    it('createPod(): should not create POD - empty symbol', async () => {
        await expectRevert(
            podERC721Factory.createPod(
                '1',            // pod id
                'Test Token1',  // pod token name
                '',             // pod symbol
                'ipfs://test1', // pod url
                { from: admin }
            ),
            `BridgeManager: token name and symbol can't be empty`
        );
    });

    it('createPod(): should not create POD - symbol too long', async () => {
        await expectRevert(
            podERC721Factory.createPod(
                '1',            // pod id
                'Test Token1',  // pod token name
                'THIS_SYMBOL_SHOULD_HAVE_A_LENGTH_LOWER_THAN_TWENTY_FIVE', // pod symbol
                'ipfs://test1', // pod url
                { from: admin }
            ),
            `BridgeManager: token Symbol too long`
        );
    });

    it('createPod(): should create POD', async () => {
        const tokensBefore = await podERC721Factory.getTotalTokenCreated();

        const txReceipt = await podERC721Factory.createPod(
            '1',            // pod id
            'Test Token1',  // pod token name
            'TST1',         // pod symbol
            'ipfs://test1', // pod url
            { from: admin }
        );

        const podAddress = await podERC721Factory.getPodAddressById('1');
        const tokensAfter = await podERC721Factory.getTotalTokenCreated();

        assert(tokensBefore.toString() === '1', 'number of tokens before should be 1');
        assert(tokensAfter.toString() === '2', 'number of tokens after should be 2');
        assert(podAddress !== ZERO_ADDRESS, 'pod token address should not be 0');

        expectEvent(txReceipt, 'PodCreated', {
            //podId: '1',
            podTokenName: 'Test Token1',
            podTokenSymbol: 'TST1'
        });
    });

    it('createPod(): should assign parent Factory to POD token contract', async () => {
        await podERC721Factory.createPod('2', 'Test Token2', 'TST2', 'ipfs://test2', { from: admin });

        const podAddress = await podERC721Factory.getPodAddressById('2');
        const erc721TokenContract = await PodERC721Token.at(podAddress);
        const podFactoryAddress = await erc721TokenContract.parentFactory();

        assert(podERC721Factory.address === podFactoryAddress, 'factory address should match');
    });

    /* ********************************************************************** 
    *                         CHECK mintPodTokenById() 
    * **********************************************************************/

    it('mintPodTokenById(): should not mint POD - missing MODERATOR_ROLE', async () => {
        await expectRevert(
            podERC721Factory.mintPodTokenById(
                '2',            // pod id
                investor1,      // to
                { from: hacker }
            ),
            'PRIVIPodERC721Factory: must have MODERATOR_ROLE to invest for investor'
        );
    });

    it('mintPodTokenById(): should not mint POD - cannot be zero address', async () => {
        await expectRevert(
            podERC721Factory.mintPodTokenById(
                '2',            // pod id
                ZERO_ADDRESS,   // to
                { from: admin }
            ),
            'PRIVIPodERC721Factory: Account address should not be zero'
        );
    });

    it('mintPodTokenById(): should not mint POD - pod id does not exist', async () => {
        await expectRevert.unspecified(
            podERC721Factory.mintPodTokenById(
                'NON_EXISTING', // pod id
                investor1,      // to
                { from: admin }
            )
        );
    });

    it('mintPodTokenById(): should mint POD', async () => {
        const podAddress = await podERC721Factory.getPodAddressById('0');
        const erc721TokenContract = await PodERC721Token.at(podAddress);

        const balanceInvestorBefore = await erc721TokenContract.balanceOf(investor1);

        await podERC721Factory.mintPodTokenById(
            '0',            // pod id
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
                podERC721Factory.mintPodTokenBySymbol(
                    'TST2',         // pod symbol
                    investor1,      // to
                    { from: hacker }
                ),
                'PRIVIPodERC721Factory: must have MODERATOR_ROLE to invest for investor'
            );
        });

        it('mintPodTokenBySymbol(): should not mint POD - cannot be zero address', async () => {
            await expectRevert(
                podERC721Factory.mintPodTokenBySymbol(
                    'TST2',         // pod symbol
                    ZERO_ADDRESS,   // to
                    { from: admin }
                ),
                'PRIVIPodERC721Factory: Account address should not be zero'
            );
        });
    
        it('mintPodTokenBySymbol(): should not mint POD - pod id does not exist', async () => {
            await expectRevert.unspecified(
                podERC721Factory.mintPodTokenBySymbol(
                    '2',            // pod symbol
                    investor1,      // to
                    { from: admin }
                )
            );
        });

        it('mintPodTokenBySymbol(): should mint POD', async () => {
            const podAddress = await podERC721Factory.getPodAddressBySymbol('TST0');
            const erc721TokenContract = await PodERC721Token.at(podAddress);
    
            const balanceInvestorBefore = await erc721TokenContract.balanceOf(investor1);
    
            await podERC721Factory.mintPodTokenBySymbol(
                'TST0',         // pod symbol
                investor1,      // to
                { from: admin }
            );
    
            const balanceInvestorAfter = await erc721TokenContract.balanceOf(investor1);
    
            assert(balanceInvestorBefore.toString() === '0', 'investors initial value should be 0');
            assert(balanceInvestorAfter.toString() === '1', 'investors final value should be 1');
        });
});