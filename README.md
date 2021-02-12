
# Installation

## .env file:
.env file need to be created with the necesary variables such as:
```
MNEMONIC="<Your Mnemonic (12 words)>"
INFURAAPP="<Infura-API-Key>"
```
## compile: 
```
truffle compile 
```

## migrate:
```
truffle migrate --network <Netwoek-Name>
```

## migrate from specific migration:
```
truffle migrate -f <number of migration> --network <Netwoek-Name>
```

## migrate from specific migration to:
```
truffle migrate -f <number of migration> --to <number of migration> --network <Netwoek-Name>
```