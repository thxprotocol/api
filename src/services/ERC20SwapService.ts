import { TAssetPool } from '@/types/TAssetPool';
import { ERC20Swap, ERC20SwapDocument } from '@/models/ERC20Swap';
import TransactionService from './TransactionService';
import { assertEvent, CustomEventLog, findEvent, hex2a } from '@/util/events';
import { InsufficientBalanceError, NotFoundError } from '@/util/errors';
import ERC20SwapRuleService from './ERC20SwapRuleService';
import { SwapState } from '@/types/enums/SwapState';
import { logger } from '@/util/logger';
import { InternalServerError } from '@/util/errors';
import { recoverAddress } from '@/util/network';
import ERC20Service from './ERC20Service';
import { AssetPoolDocument } from '@/models/AssetPool';
import { TransactionDocument } from '@/models/Transaction';
import AssetPoolService from './AssetPoolService';
import { toWei } from 'web3-utils';

async function get(id: string): Promise<ERC20SwapDocument> {
    const erc20Swap = await ERC20Swap.findById(id);
    if (!erc20Swap) throw new NotFoundError('Could not find this Swap');
    return erc20Swap;
}

async function getAll(assetPool: TAssetPool): Promise<ERC20SwapDocument[]> {
    return await ERC20Swap.find({ poolAddress: assetPool.address });
}

async function erc20Swap(
    assetPool: TAssetPool,
    callData: { call: string; nonce: number; sig: string },
    amountIn: number,
    tokenInAddress: string,
) {
    const amountInToWei = Number(toWei(amountIn.toString(), 'ether'));
    const swapRule = await ERC20SwapRuleService.findOneByQuery({
        poolAddress: assetPool.address,
        tokenInAddress,
    });

    if (!swapRule) {
        throw new NotFoundError('Could not find this Swap Rule');
    }

    const swap = await ERC20Swap.create({
        swapRuleId: swapRule.id,
        amountIn: amountInToWei,
    });

    // recover TokenIn contract
    const assetPoolDocument: AssetPoolDocument = await AssetPoolService.getByAddress(assetPool.address);
    const erc20TokenIn = await ERC20Service.findOrImport(assetPoolDocument, tokenInAddress);

    if (!erc20TokenIn) {
        throw new NotFoundError('Could not find this ERC20 Token');
    }

    // Check user balance to ensure throughput
    const userWalletAddress = recoverAddress(callData.call, callData.nonce, callData.sig);
    const userBalance = await erc20TokenIn.contract.methods.balanceOf(userWalletAddress).call();

    if (Number(userBalance) < amountInToWei) {
        console.log('userBalance < amountInToWei', { userBalance, amountInToWei });
        throw new InsufficientBalanceError();
    }

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

export default { get, getAll, erc20Swap };
