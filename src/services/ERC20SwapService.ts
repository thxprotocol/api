import { TAssetPool } from '@/types/TAssetPool';
import { ERC20Swap, ERC20SwapDocument } from '@/models/ERC20Swap';
import TransactionService from './TransactionService';
import { assertEvent, findEvent, hex2a, parseLogs } from '@/util/events';
import { InsufficientBalanceError, NotFoundError } from '@/util/errors';
import ERC20SwapRuleService from './ERC20SwapRuleService';
import { ITX_ACTIVE } from '@/config/secrets';
import InfuraService from './InfuraService';
import { SwapState } from '@/types/enums/SwapState';
import { logger } from '@/util/logger';
import { InternalServerError } from '@/util/errors';
import { recoverAddress } from '@/util/network';
import ERC20Service from './ERC20Service';
import { ethers } from 'ethers';

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
    tokenAddress: string,
) {
    const tokenOut = await ERC20Service.findBy({ address: tokenAddress, chainId: assetPool.chainId });
    if (!tokenOut) {
        throw new NotFoundError('Could not find this Token');
    }

    const swapRule = await ERC20SwapRuleService.findByQuery({
        poolAddress: assetPool.address,
        tokenInAddress: tokenAddress,
    });

    if (!swapRule) {
        throw new NotFoundError('Could not find this Swap Rule');
    }

    const swap = await ERC20Swap.create({
        swapRuleId: swapRule.id,
        amountIn: amountIn,
    });

    // Check user balance to ensure throughput
    const userWalletAddress = recoverAddress(callData.call, callData.nonce, callData.sig);
    const balance = await tokenOut.contract.methods.balanceOf(userWalletAddress).call();
    if (Number(balance) < Number(amountIn)) throw new InsufficientBalanceError();

    // Check allowance for user to ensure throughput
    const allowance = await tokenOut.contract.methods.allowance(userWalletAddress, assetPool.address).call();
    if (Number(allowance) < Number(amountIn)) {
        await TransactionService.send(
            tokenOut.contract.options.address,
            tokenOut.contract.methods.approve(assetPool.address, ethers.constants.MaxUint256),
            assetPool.chainId,
        );
    }

    if (ITX_ACTIVE) {
        const tx = await InfuraService.create(
            assetPool.address,
            'call',
            [callData.call, callData.nonce, callData.sig],
            assetPool.chainId,
        );
        swap.transactions.push(String(tx._id));

        return await swap.save();
    } else {
        try {
            const { tx, receipt } = await TransactionService.send(
                assetPool.address,
                assetPool.contract.methods.call(callData.call, callData.nonce, callData.sig),
                assetPool.chainId,
                500000,
            );

            const events = parseLogs(assetPool.contract.options.jsonInterface, receipt.logs);
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

            return await swap.save();
        } catch (error) {
            logger.error(error);
            //swap.failReason = error.message;
            throw error;
        }
    }
}

export default { get, getAll, erc20Swap };
