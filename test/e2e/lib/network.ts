import Web3 from 'web3';
import { ethers, Wallet } from 'ethers';
import { VOTER_PK } from './constants';
import { admin, provider, solutionContract } from '../../../src/util/network';
import ExampleTokenArtifact from '../../../src/artifacts/contracts/contracts/util/ExampleToken.sol/ExampleToken.json';

export const voter = new ethers.Wallet(VOTER_PK, provider);

export const timeTravel = async (seconds: number) => {
    await provider.send('evm_increaseTime', [seconds]);
    await provider.send('evm_mine', []);
};

export const exampleTokenFactory = new ethers.ContractFactory(
    ExampleTokenArtifact.abi,
    ExampleTokenArtifact.bytecode,
    admin,
);

export async function signMethod(poolAddress: string, name: string, args: any[], account: Wallet) {
    const solution = solutionContract(poolAddress);
    let nonce = await solution.getLatestNonce(await account.getAddress());
    nonce = parseInt(nonce) + 1;
    const call = solution.interface.encodeFunctionData(name, args);
    const hash = Web3.utils.soliditySha3(call, nonce);
    const sig = await account.signMessage(ethers.utils.arrayify(hash));
    return {
        call,
        nonce,
        sig,
    };
}
