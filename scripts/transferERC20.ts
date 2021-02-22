import ERC20Artifact from '../src/artifacts/@openzeppelin/contracts/token/ERC20/ERC20.sol/ERC20.json';
import hre from 'hardhat';
import { formatEther } from 'ethers/lib/utils';

const ethers = hre.ethers;

const ERC20_ADDRESS = '0x7af07C1186d50705309c923Fd850324F24D79ef8';
const RECIPIENT = '0x7D14b86c66813c7A4ed8457aBf642FAa829D9952';

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
