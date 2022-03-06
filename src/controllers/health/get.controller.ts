import { name, version, license } from '../../../package.json';
import { Response, Request } from 'express';
import { fromWei } from 'web3-utils';
import { getProvider, getEstimatesFromOracle } from '@/util/network';
import { NetworkProvider } from '@/types/enums';

import InfuraService from '@/services/InfuraService';
import { assetPoolFactoryAddress, assetPoolRegistryAddress, facetAdresses } from '@/config/contracts';
import { Transaction } from '@/models/Transaction';

async function getNetworkDetails(npid: NetworkProvider, constants: { factory: string; registry: string }) {
    const { admin, web3 } = getProvider(npid);
    const balance = await web3.eth.getBalance(admin.address);
    const gasTank = await InfuraService.getAdminBalance(npid);
    const feeData = await getEstimatesFromOracle(npid);

    return {
        admin: admin.address,
        feeData,
        balance: fromWei(balance, 'ether'),
        relay: {
            queue: (
                await Transaction.find({
                    relayTransactionHash: { $exists: true },
                    transactionHash: { $exists: false },
                })
            ).length,
            gasTank: fromWei(gasTank, 'ether'),
        },
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
