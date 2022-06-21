import { Response, Request } from 'express';
import { getProvider } from '@/util/network';
import { ChainId } from '@/types/enums';
import AssetPoolService from '@/services/AssetPoolService';
import WithdrawalService from '@/services/WithdrawalService';
import MembershipService from '@/services/MembershipService';

const controller = async (_req: Request, res: Response) => {
    // #swagger.tags = ['Metrics']
    const providerTest = getProvider(ChainId.PolygonMumbai);
    const providerMain = getProvider(ChainId.Polygon);

    const metrics = {
        count_asset_pools: {
            mainnet: await AssetPoolService.countByNetwork(ChainId.Polygon),
            testnet: await AssetPoolService.countByNetwork(ChainId.PolygonMumbai),
        },
        count_memberships: {
            mainnet: await MembershipService.countByNetwork(ChainId.Polygon),
            testnet: await MembershipService.countByNetwork(ChainId.PolygonMumbai),
        },
        count_withdrawals: {
            mainnet: await WithdrawalService.countByNetwork(ChainId.Polygon),
            testnet: await WithdrawalService.countByNetwork(ChainId.PolygonMumbai),
        },
        count_transactions: {
            mainnet:
                (await providerMain.web3.eth.getTransactionCount(providerMain.admin.address)) +
                (await providerMain.web3.eth.getTransactionCount('0xe583A501276B2E64178512e83972581f98e9290c')), // Including rotated account for accurate total
            testnet:
                (await providerTest.web3.eth.getTransactionCount(providerTest.admin.address)) +
                (await providerTest.web3.eth.getTransactionCount('0xe583A501276B2E64178512e83972581f98e9290c')), // Including rotated account for accurate total
        },
    };

    res.json(metrics);
};

export default { controller };
