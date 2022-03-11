import { name, version, license } from '../../../package.json';
import { Response, Request } from 'express';
import { fromWei } from 'web3-utils';
import { getProvider, getEstimatesFromOracle } from '@/util/network';
import { NetworkProvider } from '@/types/enums';

import InfuraService from '@/services/InfuraService';
import { assetPoolFactoryAddress, assetPoolRegistryAddress, currentVersion, facetAdresses } from '@/config/contracts';

async function getNetworkDetails(npid: NetworkProvider, constants: { factory: string; registry: string }) {
    const { admin, web3 } = getProvider(npid);
    const balance = await web3.eth.getBalance(admin.address);
    const gasTank = await InfuraService.getAdminBalance(npid);
    const feeData = await getEstimatesFromOracle(npid);

    return {
        admin: {
            address: admin.address,
            balance: fromWei(balance, 'ether'),
        },
        gasTank: {
            queue: (await InfuraService.pending(npid)).length,
            address: InfuraService.getGasTank(npid),
            balance: fromWei(gasTank, 'ether'),
        },
        feeData,
        factory: constants.factory,
        registry: constants.registry,
        facets: facetAdresses(npid),
    };
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
