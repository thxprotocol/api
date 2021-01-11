import Web3 from 'web3';
import { ethers, Contract, Wallet } from 'ethers';
import ISolutionArtifact from '../../../src/artifacts/contracts/contracts/interfaces/ISolution.sol/ISolution.json';
import ExampleTokenArtifact from '../../../src/artifacts/contracts/contracts/ExampleToken.sol/ExampleToken.json';

import { PRIVATE_KEY, RPC } from '../../../src/util/secrets';
import { VOTER_PK } from './constants';

const provider = new ethers.providers.JsonRpcProvider(RPC);

export const admin = new ethers.Wallet(PRIVATE_KEY, provider);
export const voter = new ethers.Wallet(VOTER_PK, provider);
export const testTokenFactory = new ethers.ContractFactory(
    ExampleTokenArtifact.abi,
    ExampleTokenArtifact.bytecode,
    admin,
);

export const solution = new ethers.Contract(
    process.env.ASSET_POOL_FACTORY_ADDRESS,
    ISolutionArtifact.abi,
    provider.getSigner(),
);

export const timeTravel = async (seconds: number) => {
    await provider.send('evm_increaseTime', [seconds]);
    await provider.send('evm_mine', []);
};

export async function signMethod(solution: Contract, name: string, args: any[], account: Wallet) {
    const nonce = await solution.getLatestNonce(account.getAddress());
    const call = solution.interface.encodeFunctionData(name, args);
    const hash = Web3.utils.soliditySha3(call, nonce);
    const sig = await account.signMessage(ethers.utils.arrayify(hash));

    return {
        call,
        nonce,
        sig,
    };
}
