# PRIVIEthereum Contracts

Contains all PRIVI smart contracts to interact with external networks:

- BridgeManager
- SwapManager
- PRIVIPodERC20
- PRIVIPodERC721
- PRIVIPodERC1155

## Installation:

Run `npm install` to install packages.

## Development

To run locally, run `truffle develop` from your terminal.

To compile contracts, run `truffle compile`.

## Testing

To test contracts, you must have an instance of truffle running locally. Make sure contracts are compiled and deploy them to the local development blockchain. Then, run `truffle test`.

## Deployment

To deploy to a local development blockchain, run `truffle migrate` (contracts must already be compiled and a local blockchain must be running).

To deploy to Ethereum mainnet or a Testnet, provide an .env file with the following variables:

```
MNEMONIC="<Your mnemonic seed>"
INFURA_API_KEY="<Infura-API-Key>"
```

Deploy by running `truffle migrate --network <Network-Name>`.

You can also pass a `migration ID` to deploy from a specific version: `truffle migrate -f <migration ID> --network <Network-Name>`.

Migrate from specific migration to: `truffle migrate -f <migration ID> --to <migration ID> --network <Network-Name>`.
