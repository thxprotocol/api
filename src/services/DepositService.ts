import { Contract } from 'web3-eth-contract';
import { AssetPoolType } from '@/models/AssetPool';
import { Deposit, DepositDocument } from '@/models/Deposit';
import { IAccount } from '@/models/Account';
import { DepositState } from '@/types/enums/DepositState';
import TransactionService from './TransactionService';
import InfuraService from './InfuraService';
import { NETWORK_ENVIRONMENT } from '@/config/secrets';
import { assertEvent, findEvent, hex2a, parseLogs } from '@/util/events';
import { Artifacts } from '@/config/contracts/artifacts';
import { InternalServerError } from '@/util/errors';

async function schedule(assetPool: AssetPoolType, account: IAccount, price: number, item: string) {
    return await Deposit.create({
        sub: account.id,
        sender: account.address,
        receiver: assetPool.address,
        amount: price,
        state: DepositState.Pending,
        item,
    });
}

async function create(assetPool: AssetPoolType, deposit: DepositDocument, call: string, nonce: number, sig: string) {
    if (NETWORK_ENVIRONMENT === 'dev' || NETWORK_ENVIRONMENT === 'prod') {
        const tx = await InfuraService.schedule(assetPool.address, 'call', [call, nonce, sig], assetPool.network);

        deposit.transactions.push(String(tx._id));

        return await deposit.save();
    } else {
        try {
            const { tx, receipt } = await TransactionService.send(
                assetPool.address,
                assetPool.solution.methods.call(call, nonce, sig),
                assetPool.network,
                500000,
            );

            const events = parseLogs(Artifacts.IDefaultDiamond.abi, receipt.logs);
            const result = findEvent('Result', events);

            if (!result.args.success) {
                const error = hex2a(result.args.data.substr(10));
                throw new InternalServerError(error);
            }

            assertEvent('Depositted', events);

            deposit.transactions.push(String(tx._id));
            deposit.state = DepositState.Completed;

            return await deposit.save();
        } catch (error) {
            deposit.failReason = error.message;
            throw error;
        }
    }
}

async function getAllowance(assetPool: AssetPoolType, token: Contract, account: IAccount) {
    const balance = await TransactionService.call(
        token.methods.allowance(account.address, assetPool.address),
        assetPool.network,
    );
    return Number(balance);
}

export default { create, getAllowance, schedule };
