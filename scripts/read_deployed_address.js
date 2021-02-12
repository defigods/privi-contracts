require("dotenv").config();
const bridgeManagerJson = require('../build/abis/BridgeManager.json');
const swapManagerJson = require('../build/abis/SwapManager.json');
const priviPodERC20FactoryJson = require('../build/abis/PRIVIPodERC20Factory.json');
const priviPodERC721FactoryJson = require('../build/abis/PRIVIPodERC721Factory.json');

async function main() {
	console.log('reading deployed smart contracts...')

    const bridgeManagerAddressRopsten = bridgeManagerJson['networks']['3']['address'];
    const bridgeManagerAddressRinkeby = bridgeManagerJson['networks']['4']['address'];

    const swapManagerAddressRopsten = swapManagerJson['networks']['3']['address'];
    const swapManagerAddressRinkeby = swapManagerJson['networks']['4']['address'];

    const priviPodERC20FactoryAddressRopsten = priviPodERC20FactoryJson['networks']['3']['address'];
    const priviPodERC20FactoryAddressRinkeby = priviPodERC20FactoryJson['networks']['4']['address'];

    const priviPodERC721FactoryAddressRopsten = priviPodERC721FactoryJson['networks']['3']['address'];
    const priviPodERC721FactoryAddressRinkeby = priviPodERC721FactoryJson['networks']['4']['address'];
    
    
    console.log('bridgeManagerAddress                   Ropsten', bridgeManagerAddressRopsten);
    console.log('bridgeManagerAddress                   Rinkeby', bridgeManagerAddressRinkeby);
    console.log('swapManagerAddress                     Ropsten', swapManagerAddressRopsten);
    console.log('swapManagerAddress                     Rinkeby', swapManagerAddressRinkeby);
    console.log('priviPodERC20FactoryAddress            Ropsten', priviPodERC20FactoryAddressRopsten);
    console.log('priviPodERC20FactoryAddress            Rinkeby', priviPodERC20FactoryAddressRinkeby);
    console.log('priviPodERC721FactoryAddress           Ropsten', priviPodERC721FactoryAddressRopsten);
    console.log('priviPodERC721FactoryAddress           Rinkeby', priviPodERC721FactoryAddressRinkeby);
    
};

main();