import { name, version, license } from '../../../package.json';
import { Response, Request } from 'express';
import { fromWei } from 'web3-utils';
import { getProvider, getEstimatesFromOracle } from '@/util/network';
import { NetworkProvider } from '@/types/enums';
import InfuraService from '@/services/InfuraService';
import { assetPoolFactoryAddress, assetPoolRegistryAddress, currentVersion, facetAdresses } from '@/config/contracts';
import { logger } from '@/util/logger';
import newrelic from 'newrelic';

function handleError(error: Error) {
    newrelic.noticeError(error);
    logger.error(error);
    return 'invalid response';
}

async function getFeeData(npid: NetworkProvider) {
    try {
        return await getEstimatesFromOracle(npid);
    } catch (error) {
        return handleError(error);
    }
}

async function getGasTankInfo(npid: NetworkProvider) {
    try {
        return fromWei(await InfuraService.getAdminBalance(npid), 'ether');
    } catch (error) {
        return handleError(error);
    }
}

async function getNetworkDetails(npid: NetworkProvider, constants: { factory: string; registry: string }) {
    try {
        const provider = getProvider(npid);
        const { admin, web3 } = provider;
        const balance = await web3.eth.getBalance(admin.address);

        return {
            admin: {
                address: admin.address,
                balance: fromWei(balance, 'ether'),
            },
            gasTank: {
                queue: (await InfuraService.pending(npid)).length,
                address: InfuraService.getGasTank(npid),
                balance: await getGasTankInfo(npid),
            },
            feeData: await getFeeData(npid),
            factory: constants.factory,
            registry: constants.registry,
            facets: facetAdresses(npid),
        };
    } catch (error) {
        return handleError(error);
    }
}

export const getHealth = async (req: Request, res: Response) => {
    const jsonData = {
        name,
        version,
        license,
        artifacts: currentVersion,
        testnet: await getNetworkDetails(NetworkProvider.Test, {
            factory: assetPoolFactoryAddress(NetworkProvider.Test),
            registry: assetPoolRegistryAddress(NetworkProvider.Test),
        }),
        mainnet: await getNetworkDetails(NetworkProvider.Main, {
            factory: assetPoolFactoryAddress(NetworkProvider.Main),
            registry: assetPoolRegistryAddress(NetworkProvider.Main),
        }),
    };

    res.header('Content-Type', 'application/json').send(JSON.stringify(jsonData, null, 4));
};
