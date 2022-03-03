import { Response, Request } from 'express';
import { name, version, license } from '../../../package.json';
import { getProvider, getEstimatesFromOracle } from '@/util/network';
import { NetworkProvider } from '@/types/enums';
import { fromWei } from 'web3-utils';
import { agenda, eventNameProcessWithdrawals } from '@/util/agenda';

import WithdrawalService from '@/services/WithdrawalService';
import {
    getCurrentAssetPoolFactoryAddress,
    getCurrentAssetPoolRegistryAddress,
    getCurrentFacetAdresses,
} from '@/config/network';
import InfuraService from '@/services/InfuraService';

async function getNetworkDetails(npid: NetworkProvider, constants: { factory: string; registry: string }) {
    const { admin, web3 } = getProvider(npid);
    const balance = await web3.eth.getBalance(admin.address);
    const gasTank = await InfuraService.getAdminBalance(npid);
    const feeData = await getEstimatesFromOracle(npid);

    return {
        admin: admin.address,
        feeData,
        balance: fromWei(balance, 'ether'),
        gasTank: fromWei(gasTank, 'ether'),
        factory: constants.factory,
        registry: constants.registry,
        facets: getCurrentFacetAdresses(npid),
    };
}

export const getHealth = async (req: Request, res: Response) => {
    const job = (await agenda.jobs({ name: eventNameProcessWithdrawals, type: 'single' }))[0];
    const jsonData = {
        name,
        version,
        license,
        queue: {
            scheduledWithdrawals: (await WithdrawalService.countScheduled()).length,
            lastRunAt: job?.attrs.lastRunAt,
            lastFailedAt: job?.attrs.failedAt,
        },
        testnet: await getNetworkDetails(NetworkProvider.Test, {
            factory: getCurrentAssetPoolFactoryAddress(NetworkProvider.Test),
            registry: getCurrentAssetPoolRegistryAddress(NetworkProvider.Test),
        }),
        mainnet: await getNetworkDetails(NetworkProvider.Main, {
            factory: getCurrentAssetPoolFactoryAddress(NetworkProvider.Main),
            registry: getCurrentAssetPoolRegistryAddress(NetworkProvider.Main),
        }),
    };

    res.header('Content-Type', 'application/json').send(JSON.stringify(jsonData, null, 4));
};
