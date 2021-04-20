const { expectRevert, expectEvent } = require('@openzeppelin/test-helpers');
const assert = require('assert');

// Artifacts
const BridgeManager = artifacts.require('BridgeManager');
const PodERC1155Factory = artifacts.require('PRIVIPodERC1155FactoryWhiteListed');
const PodERC1155Token = artifacts.require('PRIVIPodERC1155Token');

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

contract('PRIVI Pod Factory ERC1155', (accounts) => {
    let bridgeManagerContract;
    let podERC1155Factory;
    const NO_DATA = web3.utils.fromAscii('nothing');

    const [admin, investor1, hacker] = accounts

    beforeEach(async () => {
        // Bridge contract
        bridgeManagerContract = await BridgeManager.new({ from: admin });

        // Factory contracts
        podERC1155Factory = await PodERC1155Factory.new(bridgeManagerContract.address, { from: admin });

        // TST Token creation
        await podERC1155Factory.createPod('ipfs://test0', { from: admin });
    });

    /* ********************************************************************** 
    *                         CHECK assignRoleSwapManager() 
    * **********************************************************************/

    it('assignRoleSwapManager(): should not assign role - only admin', async () => {
        await expectRevert(
            podERC1155Factory.assignRoleSwapManager(bridgeManagerContract.address, { from: hacker }),
            'Ownable: caller is not the moderator'
        );
    });

    /* ********************************************************************** 
     *                         CHECK createPod() 
     * **********************************************************************/


    it('createPod(): should not create POD - pod id already exists', async () => {
        await expectRevert(
            podERC1155Factory.createPod(
                'ipfs://test0', // pod uri
                '5',
                { from: admin }
            ),
            'PRIVIPodERC1155Factory: Pod already exists'
        );
    });

    it('createPod(): should not create POD - empty name', async () => {
        await expectRevert(
            podERC1155Factory.createPod(
                '', // pod uri
                '4',
                { from: admin }
            ),
            `BridgeManager: token name and symbol can't be empty`
        );
    });

    it('createPod(): should not create POD - caller is not the moderator', async () => {
        await expectRevert(
            podERC1155Factory.createPod(
                'ipfs://test4', // pod uri
                '4',
                { from: hacker }
            ),
            `Ownable: caller is not the moderator`
        );
    });

    it('createPod(): should reate POD - admin add as moderator', async () => {
        await podERC1155Factory.addModerator(hacker, {from: admin})
        await podERC1155Factory.createPod(
            'ipfs://test4', // pod uri
            '5',
            { from: admin }
        );
    });

    it('createPod(): should create POD', async () => {
        const tokensBefore = await podERC1155Factory.totalPodCreated();

        const txReceipt = await podERC1155Factory.createPod(
            'ipfs://test1', // pod uri
            '5',
            { from: admin }
        );

        const podAddress = await podERC1155Factory.getPodAddressByUri('ipfs://test1');
        const tokensAfter = await podERC1155Factory.totalPodCreated();

        assert(tokensBefore.toString() === '1', 'number of tokens before should be 1');
        assert(tokensAfter.toString() === '2', 'number of tokens after should be 2');
        assert(podAddress !== ZERO_ADDRESS, 'pod token address should not be 0');

        expectEvent(txReceipt, 'PodCreated', {
            uri: web3.utils.keccak256('ipfs://test1'),
            podAddress: podAddress,
        });
    });

    it('createPod(): should assign parent Factory to POD token contract', async () => {
        await podERC1155Factory.createPod('ipfs://test2', '5', { from: admin });

        const podAddress = await podERC1155Factory.getPodAddressByUri('ipfs://test2');
        const erc1155TokenContract = await PodERC1155Token.at(podAddress);
        const podFactoryAddress = await erc1155TokenContract.parentFactory();

        assert(podERC1155Factory.address === podFactoryAddress, 'factory address should match');
    });

    /* ********************************************************************** 
    *                         CHECK mintPodTokenByUri() 
    * **********************************************************************/

    it('mintPodTokenByUri(): should not mint POD - missing MODERATOR_ROLE', async () => {
        await expectRevert(
            podERC1155Factory.mintPodTokenByUri(
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
            podERC1155Factory.mintPodTokenByUri(
                'ipfs://test0', // pod uri
                ZERO_ADDRESS,   // to
                0,              // tokenId
                100,            // amount
                NO_DATA,        // data
                { from: admin }
            ),
            'PRIVIPodERC1155Factory: Account address should not be zero'
        );
    });

    it('mintPodTokenByUri(): should not mint POD - pod id does not exist', async () => {
        await expectRevert.unspecified(
            podERC1155Factory.mintPodTokenByUri(
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
            podERC1155Factory.mintPodTokenByUri(
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
        const podAddress = await podERC1155Factory.getPodAddressByUri('ipfs://test0');
        const erc1155TokenContract = await PodERC1155Token.at(podAddress);

        const balanceInvestorBefore = await erc1155TokenContract.balanceOf(investor1, 0);

        await podERC1155Factory.mintPodTokenByUri(
            'ipfs://test0', // pod uri
            investor1,      // to
            0,              // tokenId
            100,            // amount
            NO_DATA,        // data
            { from: admin }
        );

        const balanceInvestorAfter = await erc1155TokenContract.balanceOf(investor1, 0);

        assert(balanceInvestorBefore.toString() === '0', 'investors initial amount should be 0');
        assert(balanceInvestorAfter.toString() === '100', 'investors final amount should be 100');
    });

    /* ********************************************************************** 
     *                         CHECK batchMintPodTokenByUri() 
     * **********************************************************************/

    it('batchMintPodTokenByUri(): should not mint POD - missing MODERATOR_ROLE', async () => {
        await expectRevert(
            podERC1155Factory.batchMintPodTokenByUri(
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
            podERC1155Factory.batchMintPodTokenByUri(
                'ipfs://test0', // pod uri
                ZERO_ADDRESS,   // to
                [0],            // tokenId
                [100],          // amount
                NO_DATA,        // data
                { from: admin }
            ),
            'PRIVIPodERC1155Factory: Account address should not be zero'
        );
    });

    it('batchMintPodTokenByUri(): should not mint POD - pod id does not exist', async () => {
        await expectRevert.unspecified(
            podERC1155Factory.batchMintPodTokenByUri(
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
            podERC1155Factory.batchMintPodTokenByUri(
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
        const podAddress = await podERC1155Factory.getPodAddressByUri('ipfs://test0');
        const erc1155TokenContract = await PodERC1155Token.at(podAddress);

        const balanceInvestorBefore = await erc1155TokenContract.balanceOf(investor1, 1);

        await podERC1155Factory.batchMintPodTokenByUri(
            'ipfs://test0', // pod uri
            investor1,      // to
            [0,1],          // tokenId
            [15,25],          // amount
            NO_DATA,        // data
            { from: admin }
        );

        const balanceInvestorAfter = await erc1155TokenContract.balanceOf(investor1, 1);

        assert(balanceInvestorBefore.toString() === '0', 'investors initial amount should be 0');
        assert(balanceInvestorAfter.toString() === '25', 'investors final amount should be 25');
    });
});
