import { TAssetPool } from '@/types/TAssetPool';
import { ERC20Swap, ERC20SwapDocument } from '@/models/ERC20Swap';
import TransactionService from './TransactionService';
import { assertEvent, CustomEventLog, findEvent, hex2a } from '@/util/events';
import { NotFoundError } from '@/util/errors';
import { SwapState } from '@/types/enums/SwapState';
import { logger } from '@/util/logger';
import { InternalServerError } from '@/util/errors';
import { AssetPoolDocument } from '@/models/AssetPool';
import { TransactionDocument } from '@/models/Transaction';
import { ERC20SwapRuleDocument } from '@/models/ERC20SwapRule';

async function get(id: string): Promise<ERC20SwapDocument> {
    const erc20Swap = await ERC20Swap.findById(id);
    if (!erc20Swap) throw new NotFoundError('Could not find this Swap');
    return erc20Swap;
}

async function getAll(assetPool: TAssetPool): Promise<ERC20SwapDocument[]> {
    return await ERC20Swap.find({ poolAddress: assetPool.address });
}

async function create(
    assetPool: AssetPoolDocument,
    sub: string,
    callData: { call: string; nonce: number; sig: string },
    swapRule: ERC20SwapRuleDocument,
    amountInInWei: string,
) {
    const swap = await ERC20Swap.create({
        swapRuleId: swapRule._id,
        amountIn: amountInInWei,
    });

    const callback = async (tx: TransactionDocument, events?: CustomEventLog[]): Promise<ERC20SwapDocument> => {
        if (events) {
            const result = findEvent('Result', events);

            if (!result.args.success) {
                const error = hex2a(result.args.data.substr(10));
                logger.error(error);
                throw new InternalServerError(error);
            }

            assertEvent('Swap', events);
            const swapEvent = findEvent('Swap', events);

            swap.transactions.push(String(tx._id));
            swap.state = SwapState.Completed;
            swap.amountOut = swapEvent.args.amountOut;
        }
        swap.transactions.push(String(tx._id));

        return await swap.save();
    };

    return await TransactionService.relay(
        assetPool.contract,
        'call',
        [callData.call, callData.nonce, callData.sig],
        assetPool.chainId,
        callback,
        200000,
    );
}

export default { get, getAll, create };
