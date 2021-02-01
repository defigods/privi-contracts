const HDWalletProvider = require("@truffle/hdwallet-provider");
const infuraKey = process.env.INFURASECRET;
const infuraAppKey = process.env.INFURAAPP;
const mnemonic = process.env.MNEMONIC.trim();
module.exports = {
	networks: {
		development: {
			host: "127.0.0.1",
			port: 7545,
			network_id: "5777",
		},
		mainnet: {
			provider: () => new HDWalletProvider(mnemonic, `https://mainnet.infura.io/v3/${infuraAppKey}`),
			network_id: 1, // mainnet's id
			gas: 5500000,
			gasPrice: 87000000000,
			confirmations: 0, // # of confs to wait between deployments. (default: 0)
			timeoutBlocks: 500, // # of blocks before a deployment times out  (minimum/default: 50)
			skipDryRun: false, // Skip dry run before migrations? (default: false for public nets )
		},
		ropsten: {
			provider: () => new HDWalletProvider(mnemonic, `https://ropsten.infura.io/v3/${infuraAppKey}`),
			network_id: 3, // Ropsten's id
			gas: 8000000, // Ropsten has a lower block limit than mainnet
			gasPrice: 125000000000,
			confirmations: 0, // # of confs to wait between deployments. (default: 0)
			timeoutBlocks: 500, // # of blocks before a deployment times out  (minimum/default: 50)
			skipDryRun: true, // Skip dry run before migrations? (default: false for public nets )
		},
		rinkeby: {
			provider: () => new HDWalletProvider(mnemonic, `https://rinkeby.infura.io/v3/${infuraAppKey}`),
			network_id: 4, // rinkeby's id
			gas: 8000000, // rinkeby has a lower block limit than mainnet
			gasPrice: 120000000000,
			confirmations: 0, // # of confs to wait between deployments. (default: 0)
			timeoutBlocks: 500, // # of blocks before a deployment times out  (minimum/default: 50)
			skipDryRun: true, // Skip dry run before migrations? (default: false for public nets )
		},
		advanced: {
			websockets: true, // Enable EventEmitter interface for web3 (default: false)
		},
	},
	contracts_build_directory: "./build/abis/",
	compilers: {
		solc: {
			version: "0.6.12",
			settings: {
				optimizer: {
					enabled: true,
					runs: 500,
				},
			},
		},
	},
};
