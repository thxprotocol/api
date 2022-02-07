import { Response, Request, NextFunction } from 'express';
import { HttpError } from '../../models/Error';
import {
    ASSET_POOL_FACTORY_ADDRESS,
    POOL_REGISTRY_ADDRESS,
    TESTNET_ASSET_POOL_FACTORY_ADDRESS,
    TESTNET_POOL_REGISTRY_ADDRESS,
} from '../../util/secrets';
import { name, version, license } from '../../../package.json';
import { getProvider, NetworkProvider, getEstimatesFromOracle } from '../../util/network';
import { fromWei } from 'web3-utils';
import { Facets } from '../../util/facets';
import { agenda, eventNameProcessWithdrawals } from '../../util/agenda';

import WithdrawalService from '../../services/WithdrawalService';

async function getNetworkDetails(npid: NetworkProvider, constants: { factory: string; registry: string }) {
    const { web3 } = getProvider(npid);
    const admin = web3.eth.defaultAccount;
    const balance = await web3.eth.getBalance(admin);
    const feeData = await getEstimatesFromOracle(npid);

    return {
        admin,
        feeData,
        balance: fromWei(balance, 'ether'),
        factory: constants.factory,
        registry: constants.registry,
        facets: Facets[NetworkProvider[npid]],
    };
}

export const getHealth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const job = (await agenda.jobs({ name: eventNameProcessWithdrawals, type: 'single' }))[0];
        const jsonData = {
            name,
            version,
            license,
            queue: {
                scheduledWithdrawals: (await WithdrawalService.getAllScheduled()).length,
                lastRunAt: job.attrs.lastRunAt,
                lastFailedAt: job.attrs.failedAt,
            },
            testnet: await getNetworkDetails(NetworkProvider.Test, {
                factory: TESTNET_ASSET_POOL_FACTORY_ADDRESS,
                registry: TESTNET_POOL_REGISTRY_ADDRESS,
            }),
            mainnet: await getNetworkDetails(NetworkProvider.Main, {
                factory: ASSET_POOL_FACTORY_ADDRESS,
                registry: POOL_REGISTRY_ADDRESS,
            }),
        };

        res.header('Content-Type', 'application/json').send(JSON.stringify(jsonData, null, 4));
    } catch (error) {
        next(new HttpError(502, 'Could not verify health of the API.', error));
    }
};
