import { ethers } from "hardhat";

async function main() {
  // Deploy the contract
  const PropertyVerification = await ethers.getContractFactory("PropertyVerification");
  const propertyVerification = await PropertyVerification.deploy();

  await propertyVerification.deployed();

  console.log("PropertyVerification deployed to:", propertyVerification.address);
}

// We recommend this pattern to be able to use async/await everywhere
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
