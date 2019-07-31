const HDWalletProvider = require("truffle-hdwallet-provider");

const providerUrl = process.env.INFURA_URL_KOVAN;
const providerKey = process.env.INFURA_KEY_KOVAN;
const mnemonic = process.env.MNEMONIC;
const gasPrice = process.env.GAS_PRICE;
const gasAmount = process.env.GAS_AMOUNT;

module.exports = {
    networks: {
        development: {
            host: "localhost",
            port: 8545,
            network_id: "*"
        },
        kovan: {
            gasPrice: gasPrice,
            gas: gasAmount,
            provider: () => {
                return new HDWalletProvider(mnemonic, (providerUrl + providerKey));
            },
            network_id: 42
        },
        rinkeby: {
            gasPrice: gasPrice,
            gas: gasAmount,
            provider: () => {
                return new HDWalletProvider(mnemonic, (providerUrl + providerKey));
            },
            network_id: 4
        },
        ropsten: {
            gasPrice: gasPrice,
            gas: gasAmount,
            provider: () => {
                return new HDWalletProvider(mnemonic, (providerUrl + providerKey));
            },
            network_id: 3
        },
        mainnet: {
            gasPrice: gasPrice,
            gas: gasAmount,
            provider: () => {
                return new HDWalletProvider(mnemonic, (providerUrl + providerKey));
            },
            network_id: 1
        },
    },
    mocha: {
        // timeout: 100000
        reporter: 'eth-gas-reporter',
        reporterOptions: {
            currency: 'USD',
        }
    },

    // Configure your compilers
    compilers: {
        solc: {
            version: "0.5.8", // Fetch exact version from solc-bin (default: truffle's version)
            docker: false, // Use "0.5.1" you've installed locally with docker (default: false)
            settings: { // See the solidity docs for advice about optimization and evmVersion
                optimizer: {
                    enabled: false,
                    runs: 200
                },
                evmVersion: "byzantium"
            }
        }
    }
};