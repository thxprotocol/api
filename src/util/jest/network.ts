import { Account } from 'web3-core';
import { Artifacts } from '@/util/artifacts';
import { soliditySha3 } from 'web3-utils';
import { VOTER_PK, DEPOSITOR_PK, mintAmount } from './constants';
import { callFunction, deployContract, getProvider, NetworkProvider, solutionContract } from '@/util/network';

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
};

export async function deployExampleToken(to = admin.address) {
    return await deployContract(
        Artifacts.ExampleToken.abi,
        Artifacts.ExampleToken.bytecode,
        [to, mintAmount],
        NetworkProvider.Main,
    );
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
