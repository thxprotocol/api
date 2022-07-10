import { TAssetPool } from '@/types/TAssetPool';
import { ERC20SwapRule, ERC20SwapRuleDocument } from '@/models/ERC20SwapRule';
import TransactionService from './TransactionService';
import { assertEvent, parseLogs } from '@/util/events';
import { NotFoundError } from '@/util/errors';
import { paginatedResults } from '@/util/pagination';
import ERC20Service from './ERC20Service';
import { AssetPoolDocument } from '@/models/AssetPool';
import { ERC20Token } from '@/models/ERC20Token';

async function findByQuery(poolAddress: string, page = 1, limit = 10) {
    let query = { poolAddress };
    const result = await paginatedResults(ERC20SwapRule, page, limit, query);
    return result;
}

async function findOneByQuery(query: { poolAddress: string; tokenInAddress: string }) {
    return await ERC20SwapRule.findOne(query);
}

async function get(id: string): Promise<ERC20SwapRuleDocument> {
    const erc20SwapRule = await ERC20SwapRule.findById(id);
    if (!erc20SwapRule) throw new NotFoundError('Could not find this Swap Rule');
    return erc20SwapRule;
}

async function getAll(assetPool: TAssetPool): Promise<ERC20SwapRuleDocument[]> {
    return await ERC20SwapRule.findOne({ poolAddress: assetPool.address });
}

async function exists(assetPool: TAssetPool, tokenInAddress: string, tokenMultiplier?: number) {
    return ERC20SwapRule.exists({ poolAddress: assetPool.address, tokenInAddress, tokenMultiplier });
}

async function create(assetPool: AssetPoolDocument, tokenInAddress: string, tokenMultiplier: number) {
    const { receipt } = await TransactionService.send(
        assetPool.address,
        assetPool.contract.methods.setSwapRule(tokenInAddress, tokenMultiplier),
        assetPool.chainId,
    );
    assertEvent('SwapRuleUpdated', parseLogs(assetPool.contract.options.jsonInterface, receipt.logs));

    const tokenIn = await ERC20Service.findOrImport(assetPool, tokenInAddress);

    return await ERC20SwapRule.create({
        poolId: String(assetPool._id),
        tokenInId: String(tokenIn._id),
        tokenMultiplier: tokenMultiplier,
    });
}

export default { get, getAll, create, findOneByQuery, findByQuery, exists };
