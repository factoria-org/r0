/**
 * @type import('hardhat/config').HardhatUserConfig
 */
const fs = require('fs')
const path = require('path')
require('dotenv').config()
require('@nomiclabs/hardhat-waffle')
require('hardhat-abi-exporter');
require("hardhat-gas-reporter");
require('hardhat-contract-sizer');
require("@nomiclabs/hardhat-etherscan");
task("deploy", "deploys the contract", async (args, hre) => {
  const [deployer] = await hre.ethers.getSigners();
  let Contract = await hre.ethers.getContractFactory('Royalty');
  let contract = await Contract.deploy();
  await contract.deployed();
  console.log("contract address", contract.address);
  await fs.promises.mkdir(path.resolve(__dirname, "./deployments"), { recursive: true }).catch((e) => {})
  await fs.promises.writeFile(path.resolve(__dirname, `./deployments/${hre.network.name}.json`), JSON.stringify({ address: contract.address }))
  return contract;
})
task("v", "verify on etherscan", async (args, hre) => {
  console.log("x")
  const CONTRACT_ABI = require(path.resolve(__dirname, "./abi/contracts/Royalty.sol/Royalty.json"));
  const CONTRACT_JSON = require(path.resolve(__dirname, `./deployments/${hre.network.name}.json`));
  let contractAddress = CONTRACT_JSON.address
  console.log("verify contract", contractAddress)
  try {
    await hre.run("verify:verify", {
      address: contractAddress
    });
  } catch (e) {
    console.log(e)
    console.log("already verified")
  }
})
module.exports = {
  gasReporter: {
    currency: "USD",
//    gasPrice: 80,
//    gasPrice: 150,
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
    enabled: true,
  },
  solidity: {
    version: "0.8.4",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000,
      },
    }
  },
  mocha: {
    timeout: 2000000000
  },
  networks: {
    hardhat: {
      forking: {
        url: process.env.RINKEBY
      },
      accounts: [{
        privateKey: process.env.RINKEBY_PRIVATE_KEY,
        balance: "100000000000000000000"
      }]
    },
//    hardhat: {
//      chainId: 1337,
//      timeout: 1000 * 60 * 60 * 24, // 1 day
//      gas: 12000000,
//      blockGasLimit: 0x1fffffffffffff,
//      allowUnlimitedContractSize: true,
//    },
    rinkeby: {
      url: process.env.RINKEBY,
      timeout: 1000 * 60 * 60 * 24, // 1 day
      accounts: [process.env.RINKEBY_PRIVATE_KEY],
    },
    mainnet: {
      gasPrice: 50000000000,
      timeout: 1000 * 60 * 60 * 24, // 1 day
      url: process.env.MAINNET,
      accounts: [process.env.MAINNET_PRIVATE_KEY],
    }
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  }
};
