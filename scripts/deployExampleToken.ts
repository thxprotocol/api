import hre from 'hardhat';
import { parseEther } from 'ethers/lib/utils';

const ethers = hre.ethers;

async function main() {
    const admin = (await ethers.getSigners())[0];
    const ExampleTokenFactory = await ethers.getContractFactory('ExampleToken');
    const exampleToken = await ExampleTokenFactory.deploy(admin.address, parseEther('100000'));

    await exampleToken.deployed();

    console.log('ExampleToken Address:', exampleToken.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
