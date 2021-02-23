import ERC20Artifact from '../src/artifacts/@openzeppelin/contracts/token/ERC20/ERC20.sol/ERC20.json';
import hre from 'hardhat';
import { formatEther } from 'ethers/lib/utils';

const ethers = hre.ethers;

const ERC20_ADDRESS = '0x08E86719240f7b5500F2d22F54D7BdFeb124475E';
const RECIPIENT = '0x911A524926a61c5111C9d125419cb4ABC8Ed5115';

function tokenContract(address: string, signer: any) {
    return new ethers.Contract(address, ERC20Artifact.abi, signer);
}

async function main() {
    const accounts = await ethers.getSigners();
    const address = await accounts[0].getAddress();
    const token = await tokenContract(ERC20_ADDRESS, accounts[0]);

    let senderBalance, recipientBalance;

    senderBalance = await token.balanceOf(address);
    recipientBalance = await token.balanceOf(RECIPIENT);

    console.log('Sender:', formatEther(senderBalance));
    console.log('Recipient:', formatEther(recipientBalance));

    const txApprove = await (await token.approve(RECIPIENT, senderBalance)).wait();
    console.log('TX Approve:', txApprove.transactionHash);

    const txTransfer = await (await token.transfer(RECIPIENT, senderBalance)).wait();
    console.log('TX Transfer:', txTransfer.transactionHash);

    senderBalance = await token.balanceOf(address);
    recipientBalance = await token.balanceOf(RECIPIENT);

    console.log('Sender:', formatEther(senderBalance));
    console.log('Recipient:', formatEther(recipientBalance));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
