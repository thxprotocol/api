const hre = require("hardhat");
const ethers = hre.ethers;

async function main() {
    const admin = (await ethers.getSigners())[0];
    const ExampleTokenFactory = await ethers.getContractFactory("ExampleToken");
    const testToken = await ExampleTokenFactory.deploy(admin.address, 100000e10);

    await testToken.deployed();

    console.log("TestToken Address:", testToken.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
