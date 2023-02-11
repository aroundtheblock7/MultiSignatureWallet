const hre = require("hardhat");
require('@nomicfoundation/hardhat-toolbox');

async function main() {
  const [owner1, owner2, owner3] = await ethers.getSigners();

  const _value = ethers.utils.parseEther("200");

  const MultiSig = await hre.ethers.getContractFactory("MultiSigWallet");
  const multisig = await MultiSig.deploy([owner1.address, owner2.address, owner3.address], 2, {value: _value});

  await multisig.deployed();

  console.log(
    `MultiSigWallet deployed to ${multisig.address}`
  );
  console.log(`Owner1 address: ${owner1.address}`);
  console.log(`Owner2 address: ${owner2.address}`);
  console.log(`Owner3 address: ${owner3.address}`);

  const multisigBalance = await ethers.provider.getBalance(multisig.address);
  console.log('Balance is: ' + multisigBalance);
  
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});