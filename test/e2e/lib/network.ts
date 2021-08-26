import { soliditySha3 } from 'web3-utils';
import { VOTER_PK, DEPOSITOR_PK } from './constants';
import {
    callFunction,
    deployContract,
    getAdmin,
    getProvider,
    NetworkProvider,
    solutionContract,
} from '../../../src/util/network';
import { Artifacts } from '../../../src/util/artifacts';
import { mintAmount } from './constants';
import { Account } from 'web3-core';
import Web3 from 'web3';
import AccountService from '../../../src/services/AccountService';

const web3 = getProvider(NetworkProvider.Test);

export const voter = web3.eth.accounts.privateKeyToAccount(VOTER_PK);
export const depositor = web3.eth.accounts.privateKeyToAccount(DEPOSITOR_PK);

export async function signupWithAddress(email: string, password: string) {
    const account = AccountService.signup(email, password, true, true);
    const wallet = new Web3().eth.accounts.create();

    account.address = wallet.address;

    await account.save();
    await AccountService.verifySignupToken(account.signupToken);

    return wallet;
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
    await (web3 as any).mine();
};

export async function deployExampleToken() {
    return await deployContract(
        Artifacts.ExampleToken.abi,
        Artifacts.ExampleToken.bytecode,
        [getAdmin(NetworkProvider.Test).address, mintAmount],
        NetworkProvider.Test,
    );
}

export async function signMethod(poolAddress: string, name: string, params: any[], account: Account) {
    const solution = solutionContract(NetworkProvider.Test, poolAddress);
    const abi: any = Artifacts.IDefaultDiamond.abi.find((fn) => fn.name === name);
    const nonce =
        Number(await callFunction(solution.methods.getLatestNonce(account.address), NetworkProvider.Test)) + 1;
    const call = web3.eth.abi.encodeFunctionCall(abi, params);
    const hash = soliditySha3(call, nonce);
    const sig = web3.eth.accounts.sign(hash, account.privateKey).signature;

    return {
        call,
        nonce,
        sig,
    };
}
