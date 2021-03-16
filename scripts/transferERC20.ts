import ERC20Artifact from '../src/artifacts/@openzeppelin/contracts/token/ERC20/ERC20.sol/ERC20.json';
import hre from 'hardhat';
import { formatEther } from 'ethers/lib/utils';

const ethers = hre.ethers;

const ERC20_ADDRESS = '0x278Ff6d33826D906070eE938CDc9788003749e93';
const RECIPIENT = '0xde46F6e0F666A42536e1AeD3d5Efa081089d4491';

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
