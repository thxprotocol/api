import { Account } from 'web3-core';
import { soliditySha3 } from 'web3-utils';
import { VOTER_PK, DEPOSITOR_PK } from './constants';
import { getProvider } from '@/util/network';
import { ChainId } from '@/types/enums';
import { getContractFromAbi, getDiamondAbi } from '@/config/contracts';

const { web3 } = getProvider(ChainId.Hardhat);

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
    const diamondAbi = getDiamondAbi(ChainId.Hardhat, 'defaultPool');
    const contract = getContractFromAbi(ChainId.Hardhat, diamondAbi, poolAddress);
    const abi: any = diamondAbi.find((fn) => fn.name === name);
    const nonce = Number(await contract.methods.getLatestNonce(account.address).call()) + 1;
    const call = web3.eth.abi.encodeFunctionCall(abi, params);
    const hash = soliditySha3(call, nonce);
    const sig = web3.eth.accounts.sign(hash, account.privateKey).signature;

    return {
        call,
        nonce,
        sig,
    };
}
