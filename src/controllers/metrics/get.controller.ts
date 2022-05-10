import { Response, Request } from 'express';
import { getProvider } from '@/util/network';
import { NetworkProvider } from '@/types/enums';
import AssetPoolService from '@/services/AssetPoolService';
import WithdrawalService from '@/services/WithdrawalService';
import MembershipService from '@/services/MembershipService';

const controller = async (_req: Request, res: Response) => {
    // #swagger.tags = ['Metrics']
    const providerTest = getProvider(NetworkProvider.Main);
    const providerMain = getProvider(NetworkProvider.Test);

    const metrics = {
        count_asset_pools: {
            mainnet: await AssetPoolService.countByNetwork(NetworkProvider.Main),
            testnet: await AssetPoolService.countByNetwork(NetworkProvider.Test),
        },
        count_memberships: {
            mainnet: await MembershipService.countByNetwork(NetworkProvider.Main),
            testnet: await MembershipService.countByNetwork(NetworkProvider.Test),
        },
        count_withdrawals: {
            mainnet: await WithdrawalService.countByNetwork(NetworkProvider.Main),
            testnet: await WithdrawalService.countByNetwork(NetworkProvider.Test),
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
