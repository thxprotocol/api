import BN from 'bn.js';
import { Account } from 'web3-core';
import { IAccount } from '../models/Account';
import AccountProxy from '../proxies/AccountProxy';
import { getBalance, getProvider, NetworkProvider, sendTransactionValue } from '../util/network';
import { encryptString } from '../util/encrypt';
import { decryptString } from '../util/decrypt';
import { SECURE_KEY } from '../util/secrets';

export const DEFAULT_BALANCE = new BN(200000000000);
export const MIN_BALANCE = new BN(75000000);

export class GasAdminService {
    account: IAccount;

    async init(sub: string) {
        const { account, error } = await AccountProxy.getById(sub);
        if (error) throw new Error(error.message);
        this.account = {
            ...account,
            gasAdmin: account.gasAdmin && decryptString(account.gasAdmin, SECURE_KEY.split(',')[0]),
        };
    }

    private async balanceInsurance(account: Account, npid: NetworkProvider) {
        const balance = new BN(await getBalance(npid, account.address));
        if (balance.lte(MIN_BALANCE)) {
            await sendTransactionValue(account.address, DEFAULT_BALANCE, npid);
        }
    }

    private async create(npid: NetworkProvider) {
        const { web3 } = getProvider(npid);
        const gasAccount = web3.eth.accounts.create();
        const encryptedPrivate = encryptString(gasAccount.privateKey, SECURE_KEY.split(',')[0]);
        // update owner account
        const account = {
            ...this.account,
            gasAdmin: encryptedPrivate,
        };
        // mutate database
        const { error } = await AccountProxy.update(this.account.id, account);
        if (error) throw new Error(error.message);
        // send transaction
        await sendTransactionValue(gasAccount.address, MIN_BALANCE, npid);
        // mutate internal value
        this.account = account;
        return gasAccount;
    }

    public async getAccount(npid: NetworkProvider) {
        const { web3 } = getProvider(npid);
        if (this.account.gasAdmin === undefined) {
            return await this.create(npid);
        }
        const account = web3.eth.accounts.privateKeyToAccount(this.account.gasAdmin);
        await this.balanceInsurance(account, npid);
        return account;
    }
}
