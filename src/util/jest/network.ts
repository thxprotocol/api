import { Account } from 'web3-core';
import { soliditySha3 } from 'web3-utils';
import { VOTER_PK, DEPOSITOR_PK } from './constants';
import { getProvider } from '@/util/network';
import { ChainId } from '@/types/enums';

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
