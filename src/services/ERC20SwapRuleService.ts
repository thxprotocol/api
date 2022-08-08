import { ERC20SwapRule } from '@/models/ERC20SwapRule';
import TransactionService from './TransactionService';
import { assertEvent, parseLogs } from '@/util/events';
import { paginatedResults } from '@/util/pagination';
import ERC20Service from './ERC20Service';
import { AssetPoolDocument } from '@/models/AssetPool';

function findByQuery(poolAddress: string, page = 1, limit = 10) {
    return paginatedResults(ERC20SwapRule, page, limit, { poolAddress });
}

function get(id: string) {
    return ERC20SwapRule.findById(id);
}

function findOne(query: { poolId: string; tokenInId: string; tokenMultiplier: number }) {
    return ERC20SwapRule.findOne(query);
}

async function create(assetPool: AssetPoolDocument, tokenInAddress: string, tokenMultiplier: number) {
    const receipt = await TransactionService.send(
        assetPool.address,
        assetPool.contract.methods.setSwapRule(tokenInAddress, String(tokenMultiplier)),
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

export default { get, create, findByQuery, findOne };
