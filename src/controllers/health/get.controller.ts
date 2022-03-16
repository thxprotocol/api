import { name, version, license } from '../../../package.json';
import { Response, Request } from 'express';
import { fromWei } from 'web3-utils';
import { getProvider, getEstimatesFromOracle } from '@/util/network';
import { NetworkProvider } from '@/types/enums';

import InfuraService from '@/services/InfuraService';
import { getContractConfig } from '@/config/contracts';
import { currentVersion } from '@thxnetwork/artifacts';

async function getNetworkDetails(npid: NetworkProvider) {
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
    };
}

export const getHealth = async (_req: Request, res: Response) => {
    const jsonData = {
        name,
        version,
        license,
        artifacts: currentVersion,
        testnet: {
            ...(await getNetworkDetails(NetworkProvider.Test)),
            factory: getContractConfig(NetworkProvider.Test, 'AssetPoolFactory', version).address,
            registry: getContractConfig(NetworkProvider.Test, 'PoolRegistry', version).address,
        },
        mainnet: {
            ...(await getNetworkDetails(NetworkProvider.Main)),
            factory: getContractConfig(NetworkProvider.Main, 'AssetPoolFactory', version).address,
            registry: getContractConfig(NetworkProvider.Main, 'PoolRegistry', version).address,
        },
    };

    res.header('Content-Type', 'application/json').send(JSON.stringify(jsonData, null, 4));
};
