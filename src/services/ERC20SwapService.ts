import { TAssetPool } from '@/types/TAssetPool';
import { ERC20Swap, ERC20SwapDocument } from '@/models/ERC20Swap';
import TransactionService from './TransactionService';
import { assertEvent, parseLogs } from '@/util/events';
import { NotFoundError } from '@/util/errors';
import { SwapState } from '@/types/enums/SwapState';
import { AssetPoolDocument } from '@/models/AssetPool';
import { ERC20SwapRuleDocument } from '@/models/ERC20SwapRule';
import { IAccount } from '@/models/Account';
import { ERC20Document } from '@/models/ERC20';
import { TSwapCreateCallbackArgs } from '@/types/TTransaction';
import { TransactionReceipt } from 'web3-core';
import AssetPoolService from './AssetPoolService';

async function get(id: string): Promise<ERC20SwapDocument> {
    const erc20Swap = await ERC20Swap.findById(id);
    if (!erc20Swap) throw new NotFoundError('Could not find this Swap');
    return erc20Swap;
}

async function getAll(assetPool: TAssetPool): Promise<ERC20SwapDocument[]> {
    return ERC20Swap.find({ poolAddress: assetPool.address });
}

async function create(
    assetPool: AssetPoolDocument,
    account: IAccount,
    swapRule: ERC20SwapRuleDocument,
    erc20TokenIn: ERC20Document,
    amountInInWei: string,
) {
    const swap = await ERC20Swap.create({
        swapRuleId: swapRule._id,
        amountIn: amountInInWei,
    });

    const txId = await TransactionService.sendAsync(
        assetPool.contract.options.address,
        assetPool.contract.methods.swapFor(account.address, amountInInWei, erc20TokenIn.address),
        assetPool.chainId,
        true,
        { type: 'swapCreateCallback', args: { assetPoolId: String(assetPool._id), swapId: String(swap._id) } },
    );

    return ERC20Swap.findByIdAndUpdate(swap._id, { transactions: [txId] }, { new: true });
}

async function createCallback({ swapId, assetPoolId }: TSwapCreateCallbackArgs, receipt: TransactionReceipt) {
    const { contract } = await AssetPoolService.getById(assetPoolId);
    const events = parseLogs(contract.options.jsonInterface, receipt.logs);

    const swapEvent = assertEvent('ERC20SwapFor', events);

    await ERC20Swap.findByIdAndUpdate(swapId, { state: SwapState.Completed, amountOut: swapEvent.args.amountOut });
}

export default { get, getAll, create, createCallback };
