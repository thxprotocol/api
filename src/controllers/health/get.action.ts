import { Response, Request, NextFunction } from 'express';
import { HttpError } from '../../models/Error';
import {
    ASSET_POOL_FACTORY_ADDRESS,
    POOL_REGISTRY_ADDRESS,
    TESTNET_ASSET_POOL_FACTORY_ADDRESS,
    TESTNET_POOL_REGISTRY_ADDRESS,
} from '../../util/secrets';
import { VERSION } from '../../util/secrets';
import { name, version, license } from '../../../package.json';
import { getAdmin, getProvider, NetworkProvider } from '../../util/network';
import { fromWei } from 'web3-utils';

async function getNetworkDetails(npid: NetworkProvider, constants: { factory: string; registry: string }) {
    const provider = getProvider(npid);
    const address = getAdmin(npid).address;
    const balance = await provider.eth.getBalance(address);

    return {
        admin: {
            address,
            balance: fromWei(balance, 'ether'),
        },
        factory: {
            address: constants.factory,
            deployed: (await provider.eth.getCode(constants.factory)) !== '0x',
        },
        registry: {
            address: constants.registry,
            deployed: (await provider.eth.getCode(constants.registry)) !== '0x',
        },
    };
}

export const getHealth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const jsonData = {
            name: `${name} (${VERSION})`,
            version: version,
            license: license,
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
