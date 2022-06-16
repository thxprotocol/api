import { TAssetPool } from '@/types/TAssetPool';
import { ERC20SwapRule, ERC20SwapRuleDocument } from '@/models/ERC20SwapRule';
import TransactionService from './TransactionService';
import { assertEvent, parseLogs } from '@/util/events';
import { NotFoundError } from '@/util/errors';
import { paginatedResults } from '@/util/pagination';

async function findByQuery(poolAddress: string, page = 1, limit = 10) {
    let query = { to: poolAddress };
    const result = await paginatedResults(ERC20SwapRule, page, limit, query);
    return result;
}

async function findOneByQuery(query: { poolAddress: string; tokenInAddress: string }) {
    return await ERC20SwapRule.findOne(query);
}

async function get(id: string): Promise<ERC20SwapRuleDocument> {
    const erc20SwapRule = await ERC20SwapRule.findById(id);
    if (!erc20SwapRule) throw new NotFoundError('Could not find this Swap Rule');;
    return erc20SwapRule;
}

async function getAll(assetPool: TAssetPool): Promise<ERC20SwapRuleDocument[]> {
    return await ERC20SwapRule.find({ poolAddress: assetPool.address });
}

async function erc20SwapRule(assetPool: TAssetPool, tokenInAddress: string, tokenMultiplier: number) {
    const { receipt } = await TransactionService.send(
        assetPool.address,
        assetPool.contract.methods.setSwapRule(tokenInAddress, tokenMultiplier),
        assetPool.chainId,
    );

    assertEvent('SwapRuleUpdated', parseLogs(assetPool.contract.options.jsonInterface, receipt.logs));

    return await ERC20SwapRule.create({
        chainId: assetPool.chainId,
        poolAddress: assetPool.address,
        tokenInAddress,
        tokenMultiplier,
    });
}

export default { get, getAll, erc20SwapRule, findOneByQuery, findByQuery };
