const { expectRevert, expectEvent, BN } = require('@openzeppelin/test-helpers');
const assert = require('assert');

// Artifacts
const BridgeManager = artifacts.require('BridgeManager');

contract('BridgeManager', (accounts) => {
    let bridgeManagerContract;
    const [admin, ERC20Address, ERC721Address, ERC1155Address] = accounts;

    const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

    const ROLES = {
        DEFAULT_ADMIN: ZERO_ADDRESS,
        REGISTER: web3.utils.keccak256('REGISTER_ROLE'),
    };

    const erc20TestToken = {
        name: 'ERC20 Test Token',
        symbol: 'TST20',
        deployedAddress: ERC20Address,
        type: 'ERC20',
    };

    const erc721TestToken = {
        name: 'ERC721 Test Token',
        symbol: 'TST721',
        deployedAddress: ERC721Address,
        type: 'ERC721',
    };

    const erc1155TestToken = {
        name: 'ERC1155 Test Token',
        tokenURI: 'TST1155',
        deployedAddress: ERC1155Address,
        type: 'ERC1155',
    };

    beforeEach(async () => {
        // Bridge contract
        bridgeManagerContract = await BridgeManager.new({ from: admin });
    });

    /* ********************************************************************** 
    *                         CHECK roles 
    * **********************************************************************/

    it('admin should have ADMIN & REGISTER roles', async () => {
        const isAdminRole = await bridgeManagerContract.hasRole(ROLES.DEFAULT_ADMIN, admin);
        const isRegisterRole = await bridgeManagerContract.hasRole(ROLES.REGISTER, admin);

        assert(isAdminRole === true, 'should have ADMIN role');
        assert(isRegisterRole === true, 'should have REGISTER role');
    });

    /* ********************************************************************** 
    *                         CHECK registerTokenERC20() 
    * **********************************************************************/

    it('registerTokenERC20(): should not register token - already registered', async () => {
        await bridgeManagerContract.registerTokenERC20(
            erc20TestToken.name,
            erc20TestToken.symbol,
            erc20TestToken.deployedAddress
        );

        await expectRevert(
            bridgeManagerContract.registerTokenERC20(
                erc20TestToken.name,
                erc20TestToken.symbol,
                erc20TestToken.deployedAddress
            ),
            'BridgeManager: token address is already registered'
        );
    });

    it('registerTokenERC20(): should not register token - symbol too long', async () => {
        await expectRevert(
            bridgeManagerContract.registerTokenERC20(
                erc20TestToken.name,
                'THIS_SYMBOL_SHOULD_HAVE_A_LENGTH_LOWER_THAN_TWENTY_FIVE',
                erc20TestToken.deployedAddress
            ),
            'BridgeManager: token Symbol too long'
        );
    });

    it('registerTokenERC20(): should not register token - empty name', async () => {
        await expectRevert(
            bridgeManagerContract.registerTokenERC20(
                '',
                erc20TestToken.symbol,
                erc20TestToken.deployedAddress
            ),
            `BridgeManager: token name and symbol can't be empty`
        );
    });

    it('registerTokenERC20(): should not register token - empty symbol', async () => {
        await expectRevert(
            bridgeManagerContract.registerTokenERC20(
                erc20TestToken.name,
                '',
                erc20TestToken.deployedAddress
            ),
            `BridgeManager: token name and symbol can't be empty`
        );
    });

    it('registerTokenERC20(): should register token', async () => {
        const registeredTokensBefore = await bridgeManagerContract.getAllErc20Count();

        const txReceipt = await bridgeManagerContract.registerTokenERC20(
            erc20TestToken.name,
            erc20TestToken.symbol,
            erc20TestToken.deployedAddress
        );

        const tokenAddress = await bridgeManagerContract.getErc20AddressRegistered(erc20TestToken.symbol);
        const registeredTokensAfter = await bridgeManagerContract.getAllErc20Count();
        
        assert(registeredTokensBefore.toString() === '0', 'registered tokens should be 0');
        assert(registeredTokensAfter.toString() === '1', 'registered tokens should be 1');

        expectEvent(txReceipt, 'RegisterERC20Token', {
            // name: erc20TestToken.name,
            tokenAddress: tokenAddress
        });
    });

    /* ********************************************************************** 
    *                         CHECK registerTokenERC721() 
    * **********************************************************************/

    it('registerTokenERC721(): should not register token - already registered', async () => {
        await bridgeManagerContract.registerTokenERC721(
            erc721TestToken.name,
            erc721TestToken.symbol,
            erc721TestToken.deployedAddress
        );

        await expectRevert(
            bridgeManagerContract.registerTokenERC721(
                erc721TestToken.name,
                erc721TestToken.symbol,
                erc721TestToken.deployedAddress
            ),
            'BridgeManager: token address is already registered'
        );
    });

    it('registerTokenERC721(): should not register token - symbol too long', async () => {
        await expectRevert(
            bridgeManagerContract.registerTokenERC721(
                erc721TestToken.name,
                'THIS_SYMBOL_SHOULD_HAVE_A_LENGTH_LOWER_THAN_TWENTY_FIVE',
                erc721TestToken.deployedAddress
            ),
            'BridgeManager: token Symbol too long'
        );
    });

    it('registerTokenERC721(): should not register token - empty name', async () => {
        await expectRevert(
            bridgeManagerContract.registerTokenERC721(
                '',
                erc721TestToken.symbol,
                erc721TestToken.deployedAddress
            ),
            `BridgeManager: token name and symbol can't be empty`
        );
    });

    it('registerTokenERC721(): should not register token - empty symbol', async () => {
        await expectRevert(
            bridgeManagerContract.registerTokenERC721(
                erc721TestToken.name,
                '',
                erc721TestToken.deployedAddress
            ),
            `BridgeManager: token name and symbol can't be empty`
        );
    });

    it('registerTokenERC721(): should register token', async () => {
        const registeredTokensBefore = await bridgeManagerContract.getAllErc721Count();

        const txReceipt = await bridgeManagerContract.registerTokenERC721(
            erc721TestToken.name,
            erc721TestToken.symbol,
            erc721TestToken.deployedAddress
        );

        const tokenAddress = await bridgeManagerContract.getErc721AddressRegistered(erc721TestToken.symbol);
        const registeredTokensAfter = await bridgeManagerContract.getAllErc721Count();
        
        assert(registeredTokensBefore.toString() === '0', 'registered tokens should be 0');
        assert(registeredTokensAfter.toString() === '1', 'registered tokens should be 1');

        expectEvent(txReceipt, 'RegisterERC721Token', {
            // name: ERC721TestToken.name,
            tokenAddress: tokenAddress
        });
    });

    /* ********************************************************************** 
    *                         CHECK registerTokenERC1155() 
    * **********************************************************************/

    it('registerTokenERC1155(): should not register token - already registered', async () => {
        await bridgeManagerContract.registerTokenERC1155(
            erc1155TestToken.name,
            erc1155TestToken.tokenURI,
            erc1155TestToken.deployedAddress
        );

        await expectRevert(
            bridgeManagerContract.registerTokenERC1155(
                erc1155TestToken.name,
                erc1155TestToken.tokenURI,
                erc1155TestToken.deployedAddress
            ),
            'BridgeManager: token address is already registered'
        );
    });

    it('registerTokenERC1155(): should not register token - empty URI', async () => {
        await expectRevert(
            bridgeManagerContract.registerTokenERC1155(
                erc1155TestToken.name,
                '',
                erc1155TestToken.deployedAddress
            ),
            `BridgeManager: token name and symbol can't be empty`
        );
    });

    it('registerTokenERC1155(): should register token', async () => {
        const registeredTokensBefore = await bridgeManagerContract.getAllErc1155Count();

        const txReceipt = await bridgeManagerContract.registerTokenERC1155(
            erc1155TestToken.name,
            erc1155TestToken.tokenURI,
            erc1155TestToken.deployedAddress
        );

        const tokenAddress = await bridgeManagerContract.getErc1155AddressRegistered(erc1155TestToken.tokenURI);
        const registeredTokensAfter = await bridgeManagerContract.getAllErc1155Count();
        
        assert(registeredTokensBefore.toString() === '0', 'registered tokens should be 0');
        assert(registeredTokensAfter.toString() === '1', 'registered tokens should be 1');

        expectEvent(txReceipt, 'RegisterERC1155Token', {
            // name: ERC1155TestToken.name,
            tokenAddress: tokenAddress
        });
    });

});
