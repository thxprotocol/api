import { TAssetPool } from '@/types/TAssetPool';
import { Deposit, DepositDocument } from '@/models/Deposit';
import { IAccount } from '@/models/Account';
import { DepositState } from '@/types/enums/DepositState';
import TransactionService from './TransactionService';
import { assertEvent, parseLogs } from '@/util/events';
import { TDepositCallbackArgs } from '@/types/TTransaction';
import AssetPoolService from './AssetPoolService';
import { TransactionReceipt } from 'web3-core';
import { AssetPoolDocument } from '@/models/AssetPool';

async function get(assetPool: TAssetPool, depositId: number): Promise<DepositDocument> {
    const deposit = await Deposit.findOne({ poolAddress: assetPool.address, id: depositId });
    if (!deposit) return null;
    return deposit;
}

async function getAll(assetPool: TAssetPool): Promise<DepositDocument[]> {
    return await Deposit.find({ poolAddress: assetPool.address });
}

async function deposit(assetPool: AssetPoolDocument, account: IAccount, amount: string, item: string) {
    const deposit = await Deposit.create({
        sub: account.id,
        sender: account.address,
        receiver: assetPool.address,
        amount,
        state: DepositState.Pending,
        item,
    });

    const txId = await TransactionService.sendAsync(
        assetPool.contract.options.address,
        assetPool.contract.methods.depositFrom(account.address, amount),
        assetPool.chainId,
        true,
        { type: 'depositCallback', args: { depositId: String(deposit._id), assetPoolId: String(assetPool._id) } },
    );

    return await Deposit.findByIdAndUpdate(deposit._id, { transactions: [txId] }, { new: true });
}

async function depositCallback({ depositId, assetPoolId }: TDepositCallbackArgs, receipt: TransactionReceipt) {
    const { contract } = await AssetPoolService.getById(assetPoolId);
    const events = parseLogs(contract.options.jsonInterface, receipt.logs);
    if (events) {
        assertEvent('ERC20DepositFrom', events);
        await Deposit.findByIdAndUpdate(depositId, { state: DepositState.Completed });
    }
}

export default { get, getAll, deposit, depositCallback };
