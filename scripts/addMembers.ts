import dotenv from 'dotenv';
import IDefaultDiamondArtifact from '../src/artifacts/contracts/contracts/IDefaultDiamond.sol/IDefaultDiamond.json';
import { Wallet } from '@ethersproject/wallet';
import { ethers } from 'ethers';

dotenv.config({ path: '.env' });

const POOL_ADDRESS = '';
const ACCOUNTS = [];

function solutionContract(address: string, signer: any) {
    return new ethers.Contract(address, IDefaultDiamondArtifact.abi, signer);
}

async function main() {
    const mainnetProvider = new ethers.providers.WebSocketProvider(process.env.RPC_WSS);
    const signer = new Wallet(process.env.PRIVATE_KEY, mainnetProvider);
    const solution = await solutionContract(POOL_ADDRESS, signer);

    for (const address of ACCOUNTS) {
        const tx = await (await solution.addMember(address)).wait();

        if (!tx.error) {
            console.log('Added: ', address);
        } else {
            console.log('Failed: ', tx.error);
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
