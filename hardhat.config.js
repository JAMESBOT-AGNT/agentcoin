require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

// Configurações de rede
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const BASESCAN_API_KEY = process.env.BASESCAN_API_KEY;
const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },

  networks: {
    hardhat: {
      chainId: 31337
    },

    // Base Mainnet
    base: {
      url: "https://mainnet.base.org",
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 8453,
      gasPrice: "auto"
    },

    // Base Goerli Testnet
    base_goerli: {
      url: "https://goerli.base.org",
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 84531,
      gasPrice: "auto"
    },

    // Base Sepolia Testnet
    base_sepolia: {
      url: "https://sepolia.base.org",
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 84532,
      gasPrice: "auto"
    },

    // Ethereum Mainnet (para referência)
    mainnet: {
      url: ALCHEMY_API_KEY ? `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_API_KEY}` : "",
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 1
    }
  },

  // Configuração do Etherscan para verificação de contratos
  etherscan: {
    apiKey: {
      mainnet: process.env.ETHERSCAN_API_KEY,
      base: BASESCAN_API_KEY,
      base_goerli: BASESCAN_API_KEY,
      base_sepolia: BASESCAN_API_KEY
    },
    customChains: [
      {
        network: "base",
        chainId: 8453,
        urls: {
          apiURL: "https://api.basescan.org/api",
          browserURL: "https://basescan.org"
        }
      },
      {
        network: "base_goerli", 
        chainId: 84531,
        urls: {
          apiURL: "https://api-goerli.basescan.org/api",
          browserURL: "https://goerli.basescan.org"
        }
      },
      {
        network: "base_sepolia",
        chainId: 84532, 
        urls: {
          apiURL: "https://api-sepolia.basescan.org/api",
          browserURL: "https://sepolia.basescan.org"
        }
      }
    ]
  },

  // Configuração do gas reporter
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD"
  },

  // Paths
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};