import { Account } from 'web3-core';
import { Artifacts } from '../../../src/util/artifacts';
import { soliditySha3 } from 'web3-utils';
import { VOTER_PK, DEPOSITOR_PK, mintAmount } from './constants';
import {
    callFunction,
    deployContract,
    getProvider,
    NetworkProvider,
    solutionContract,
} from '../../../src/util/network';
import { ethers, Wallet } from 'ethers';
import { RPC } from '../../../src/util/secrets';

const { web3, admin } = getProvider(NetworkProvider.Main);

export const voter = web3.eth.accounts.privateKeyToAccount(VOTER_PK);
export const depositor = web3.eth.accounts.privateKeyToAccount(DEPOSITOR_PK);

export function createWallet(privateKey: string) {
    return web3.eth.accounts.privateKeyToAccount(privateKey);
}

export const timeTravel = async (seconds: number) => {
    web3.extend({
        methods: [
            {
                name: 'increaseTime',
                call: 'evm_increaseTime',
                params: 1,
            },
            {
                name: 'mine',
                call: 'evm_mine',
            },
        ],
    });
    await (web3 as any).increaseTime(seconds);
    // await (web3 as any).mine();
};
export async function deployExampleToken(to = admin.address) {
    return await deployContract(
        Artifacts.ExampleToken.abi,
        Artifacts.ExampleToken.bytecode,
        [to, mintAmount],
        NetworkProvider.Main,
    );
}

const provider = new ethers.providers.JsonRpcProvider(RPC);

export async function helpSign(poolAddress: string, name: string, args: any, account: Wallet) {
    const solution = new ethers.Contract(poolAddress, Artifacts.IDefaultDiamond.abi, provider);
    let nonce = await solution.getLatestNonce(account.getAddress());
    nonce = parseInt(nonce) + 1;
    const call = solution.interface.encodeFunctionData(name, args);
    const hash = web3.utils.soliditySha3(call, nonce);
    const sig = await account.signMessage(ethers.utils.arrayify(hash));

    return { call, nonce, sig };
}

export async function signMethod(poolAddress: string, name: string, params: any[], account: Account) {
    const solution = solutionContract(NetworkProvider.Main, poolAddress);
    const abi: any = Artifacts.IDefaultDiamond.abi.find((fn) => fn.name === name);
    const nonce =
        Number(await callFunction(solution.methods.getLatestNonce(account.address), NetworkProvider.Main)) + 1;
    const call = web3.eth.abi.encodeFunctionCall(abi, params);
    const hash = soliditySha3(call, nonce);
    const sig = web3.eth.accounts.sign(hash, account.privateKey).signature;

    return {
        call,
        nonce,
        sig,
    };
}
