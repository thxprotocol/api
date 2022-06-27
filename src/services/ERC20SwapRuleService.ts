import { TAssetPool } from '@/types/TAssetPool';
import { ERC20SwapRule, ERC20SwapRuleDocument } from '@/models/ERC20SwapRule';
import TransactionService from './TransactionService';
import { assertEvent, parseLogs } from '@/util/events';
import { NotFoundError } from '@/util/errors';
import { paginatedResults } from '@/util/pagination';
import ERC20Service from './ERC20Service';
import { AssetPoolDocument } from '@/models/AssetPool';
import AssetPoolService from './AssetPoolService';
import { ERC20Token } from '@/models/ERC20Token';

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
    if (!erc20SwapRule) throw new NotFoundError('Could not find this Swap Rule');
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

    // retrieve the tokenId
    const assetPoolDocument: AssetPoolDocument = await AssetPoolService.getByAddress(assetPool.address);
    const erc20 = await ERC20Service.findOrImport(assetPoolDocument, tokenInAddress);

    const erc20Token = await ERC20Token.findOne({
        sub: erc20.sub,
        erc20Id: String(erc20._id),
    });

    const swapRule = await ERC20SwapRule.create({
        chainId: assetPool.chainId,
        poolAddress: assetPool.address,
        tokenInId: erc20Token._id,
        tokenInAddress,
        tokenMultiplier: tokenMultiplier,
    });
    await swapRule.save();
    return swapRule;
}

export default { get, getAll, erc20SwapRule, findOneByQuery, findByQuery };
