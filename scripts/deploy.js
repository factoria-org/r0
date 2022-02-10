const fs = require('fs');
const path = require('path');
const { ethers } = require('hardhat');
const deploy = async () => {
  const [deployer] = await ethers.getSigners();
  let Token = await ethers.getContractFactory('Token');
  let token = await Token.deploy();
  await token.deployed();
  console.log("token address", token.address);
}
deploy().then(() => {
  process.exit(0)
}).catch((e) => {
  console.error(e)
  process.exit(1)
})
