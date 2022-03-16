import { Account } from 'web3-core';
import { soliditySha3 } from 'web3-utils';
import { VOTER_PK, DEPOSITOR_PK } from './constants';
import { getContractFromAbi, getProvider } from '@/util/network';
import { NetworkProvider } from '@/types/enums';
import TransactionService from '@/services/TransactionService';
import { diamondAbi } from '@/config/contracts';

const { web3 } = getProvider(NetworkProvider.Main);

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

export async function signMethod(poolAddress: string, name: string, params: any[], account: Account) {
    const contract = getContractFromAbi(
        NetworkProvider.Main,
        diamondAbi(NetworkProvider.Main, 'defaultPool'),
        poolAddress,
    );
    const abi: any = diamondAbi(NetworkProvider.Main, 'defaultPool').find((fn) => fn.name === name);
    const nonce =
        Number(await TransactionService.call(contract.methods.getLatestNonce(account.address), NetworkProvider.Main)) +
        1;
    const call = web3.eth.abi.encodeFunctionCall(abi, params);
    const hash = soliditySha3(call, nonce);
    const sig = web3.eth.accounts.sign(hash, account.privateKey).signature;

    return {
        call,
        nonce,
        sig,
    };
}
