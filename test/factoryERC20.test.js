const { expectRevert, expectEvent, BN } = require('@openzeppelin/test-helpers');
const web3 = require('web3');
const assert = require('assert');

// Artifacts
const BridgeManager = artifacts.require('BridgeManager');
const PodERC20Factory = artifacts.require('PRIVIPodERC20Factory');
const PodERC20Token = artifacts.require('PRIVIPodERC20Token');

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

contract('PRIVI Pod Factory ERC20', (accounts) => {
    let bridgeManagerContract;
    let podERC20Factory;
    //let PodERC20Token;

    const [admin, investor1, hacker] = accounts

    beforeEach(async () => {
        // Bridge contract
        bridgeManagerContract = await BridgeManager.new({ from: admin });

        // Factory contracts
        podERC20Factory = await PodERC20Factory.new(bridgeManagerContract.address, { from: admin });

        // TST Token creation
        await podERC20Factory.createPod('0', 'Test Token', 'TST', { from: admin });
    });

    /* ********************************************************************** 
    *                         CHECK assignRoleSwapManager() 
    * **********************************************************************/

    it('assignRoleSwapManager(): should not assign role - only admin', async () => {
        await expectRevert(
            podERC20Factory.assignRoleSwapManager(bridgeManagerContract.address, { from: hacker }),
            'PRIVIPodERC20Factory: must have MODERATOR_ROLE to assign SwapManager address'
        );
    });

    // it('assignRoleSwapManager(): should assign role', async () => {
    //     await podERC20Factory.assignRoleSwapManager(bridgeManagerContract.address, { from: admin });
    // });

    /* ********************************************************************** 
     *                         CHECK createPod() 
     * **********************************************************************/

    it('createPod(): should not create POD - pod id already exists', async () => {
        await expectRevert(
            podERC20Factory.createPod(
                '0',            // pod id
                'Test Token',   // pod token name
                'TST',          // pod symbol
                { from: admin }
            ),
            'PRIVIPodERC20Factory: Pod id already exists'
        );
    });

    it('createPod(): should not create POD - pod symbol already exists', async () => {
        await expectRevert(
            podERC20Factory.createPod(
                '4',            // pod id
                'Test Token',   // pod token name
                'TST',          // pod symbol
                { from: admin }
            ),
            'PRIVIPodERC20Factory: Pod symbol already exists'
        );
    });

    it('createPod(): should not create POD - empty name', async () => {
        await expectRevert(
            podERC20Factory.createPod(
                '4',            // pod id
                '',             // pod token name
                'TST2',          // pod symbol
                { from: admin }
            ),
            `BridgeManager: token name and symbol can't be empty`
        );
    });

    it('createPod(): should not create POD - empty symbol', async () => {
        await expectRevert(
            podERC20Factory.createPod(
                '4',            // pod id
                'Test3',        // pod token name
                '',             // pod symbol
                { from: admin }
            ),
            `BridgeManager: token name and symbol can't be empty`
        );
    });

    it('createPod(): should not create POD - symbol too long', async () => {
        await expectRevert(
            podERC20Factory.createPod(
                '4',            // pod id
                'Test3',        // pod token name
                'THIS_SYMBOL_SHOULD_HAVE_A_LENGTH_LOWER_THAN_TWENTY_FIVE', // pod symbol
                { from: admin }
            ),
            `BridgeManager: token Symbol too long`
        );
    });

    it('createPod(): should create POD', async () => {
        const tokensBefore = await podERC20Factory.getTotalTokenCreated();

        const txReceipt = await podERC20Factory.createPod(
            '1',            // pod id
            'Test Token1',  // pod token name
            'TST1',         // pod symbol
            { from: admin }
        );

        const podAddress = await podERC20Factory.getPodAddressById('1');
        const tokensAfter = await podERC20Factory.getTotalTokenCreated();

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
        await podERC20Factory.createPod('2', 'Test Token2', 'TST2', { from: admin });

        const podAddress = await podERC20Factory.getPodAddressById('2');
        const erc20TokenContract = await PodERC20Token.at(podAddress);
        const podFactoryAddress = await erc20TokenContract.parentFactory();

        assert(podERC20Factory.address === podFactoryAddress, 'factory address should match');
    });

    /* ********************************************************************** 
     *                         CHECK mintPodTokenById() 
     * **********************************************************************/

    it('mintPodTokenById(): should not mint POD - missing MODERATOR_ROLE', async () => {
        await expectRevert(
            podERC20Factory.mintPodTokenById(
                '2',            // pod id
                investor1,      // to
                5,               // amount
                { from: hacker }
            ),
            'PRIVIPodERC20Factory: must have MODERATOR_ROLE to invest for investor'
        );
    });

    it('mintPodTokenById(): should not mint POD - cannot be zero address', async () => {
        await expectRevert(
            podERC20Factory.mintPodTokenById(
                '2',            // pod id
                ZERO_ADDRESS,   // to
                5,              // amount
                { from: admin }
            ),
            'PRIVIPodERC20Factory: Account address should not be zero'
        );
    });

    it('mintPodTokenById(): should not mint POD - amount must be greater than zero', async () => {
        await expectRevert(
            podERC20Factory.mintPodTokenById(
                '2',            // pod id
                investor1,      // to
                0,              // amount
                { from: admin }
            ),
            'PRIVIPodERC20Factory: investAmount should not be zero'
        );
    });

    it('mintPodTokenById(): should not mint POD - pod id does not exist', async () => {
        await expectRevert.unspecified(
            podERC20Factory.mintPodTokenById(
                'NON_EXISTING', // pod id
                investor1,      // to
                10,             // amount
                { from: admin }
            )
        );
    });

    it('mintPodTokenById(): should mint POD', async () => {
        const podAddress = await podERC20Factory.getPodAddressById('0');
        const erc20TokenContract = await PodERC20Token.at(podAddress);

        const balanceInvestorBefore = await erc20TokenContract.balanceOf(investor1);

        await podERC20Factory.mintPodTokenById(
            '0',            // pod id
            investor1,      // to
            10,             // amount
            { from: admin }
        );

        const balanceInvestorAfter = await erc20TokenContract.balanceOf(investor1);

        assert(balanceInvestorBefore.toString() === '0', 'investors initial value should be 0');
        assert(balanceInvestorAfter.toString() === '10', 'investors final value should be 10');
    });

    /* ********************************************************************** 
     *                         CHECK mintPodTokenBySymbol() 
     * **********************************************************************/

    it('mintPodTokenBySymbol(): should not mint POD - missing MODERATOR_ROLE', async () => {
        await expectRevert(
            podERC20Factory.mintPodTokenBySymbol(
                'TST2',         // pod symbol
                investor1,      // to
                5,              // amount
                { from: hacker }
            ),
            'PRIVIPodERC20Factory: must have MODERATOR_ROLE to invest for investor'
        );
    });

    it('mintPodTokenBySymbol(): should not mint POD - cannot be zero address', async () => {
        await expectRevert(
            podERC20Factory.mintPodTokenBySymbol(
                'TST2',         // pod symbol
                ZERO_ADDRESS,   // to
                5,              // amount
                { from: admin }
            ),
            'PRIVIPodERC20Factory: Account address should not be zero'
        );
    });

    it('mintPodTokenBySymbol(): should not mint POD - amount must be greater than zero', async () => {
        await expectRevert(
            podERC20Factory.mintPodTokenBySymbol(
                'TST2',         // pod symbol
                investor1,      // to
                0,              // amount
                { from: admin }
            ),
            'PRIVIPodERC20Factory: investAmount should not be zero'
        );
    });

    it('mintPodTokenBySymbol(): should not mint POD - pod id does not exist', async () => {
        await expectRevert.unspecified(
            podERC20Factory.mintPodTokenBySymbol(
                '2',            // pod symbol
                investor1,      // to
                10,             // amount
                { from: admin }
            )
        );
    });

    it('mintPodTokenBySymbol(): should mint POD', async () => {
        const podAddress = await podERC20Factory.getPodAddressBySymbol('TST');
        const erc20TokenContract = await PodERC20Token.at(podAddress);

        const balanceInvestorBefore = await erc20TokenContract.balanceOf(investor1);

        await podERC20Factory.mintPodTokenBySymbol(
            'TST',          // pod symbol
            investor1,      // to
            10,             // amount
            { from: admin }
        );

        const balanceInvestorAfter = await erc20TokenContract.balanceOf(investor1);

        assert(balanceInvestorBefore.toString() === '0', 'investors initial value should be 0');
        assert(balanceInvestorAfter.toString() === '10', 'investors final value should be 10');
    });

});