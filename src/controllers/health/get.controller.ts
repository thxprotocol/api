import { name, version, license } from '../../../package.json';
import { Response, Request } from 'express';
import { fromWei } from 'web3-utils';
import { getProvider } from '@/util/network';
import { ChainId } from '@/types/enums';
import { diamondFacetAddresses, getContractConfig, getContractFromName } from '@/config/contracts';
import { logger } from '@/util/logger';
import newrelic from 'newrelic';
import { currentVersion, diamondVariants } from '@thxnetwork/artifacts';
import { NODE_ENV } from '@/config/secrets';

function handleError(error: Error) {
    newrelic.noticeError(error);
    logger.error(error);
    return { error: 'invalid response' };
}

function facetAdresses(chainId: ChainId) {
    const result: Record<string, unknown> = {};

    for (const variant of diamondVariants) {
        result[variant] = diamondFacetAddresses(chainId, variant);
    }

    return result;
}

async function getNetworkDetails(chainId: ChainId) {
    try {
        const { defaultAccount, relayer, web3 } = getProvider(chainId);
        const balance = await web3.eth.getBalance(defaultAccount);

        let queue;
        if (relayer) {
            const [pending, failed, mined] = await Promise.all([
                await relayer.list({ status: 'pending' }),
                await relayer.list({ status: 'failed' }),
                await relayer.list({ status: 'mined' }),
            ]);

            queue = {
                pending: pending.length,
                failed: failed.length,
                mined: mined.length,
            };
        }

        return {
            admin: {
                address: defaultAccount,
                balance: fromWei(balance, 'ether'),
            },
            queue,
            facets: facetAdresses(chainId),
            registry: getContractConfig(chainId, 'Registry').address,
            factory: getContractConfig(chainId, 'Factory').address,
            feeCollector: await poolRegistry(chainId).methods.feeCollector().call(),
        };
    } catch (error) {
        return handleError(error);
    }
}

function poolRegistry(chainId: ChainId) {
    try {
        const { address } = getContractConfig(chainId, 'Registry');
        return getContractFromName(chainId, 'Registry', address);
    } catch (error) {
        return undefined;
    }
}

export const getHealth = async (_req: Request, res: Response) => {
    // #swagger.tags = ['Health']
    const result: any = {
        name,
        version,
        license,
        artifacts: currentVersion,
    };

    if (NODE_ENV !== 'production') {
        result.hardhat = await getNetworkDetails(ChainId.Hardhat);
    } else {
        const [hardhat, testnet, mainnet] = await Promise.all([
            await getNetworkDetails(ChainId.Hardhat),
            await getNetworkDetails(ChainId.PolygonMumbai),
            await getNetworkDetails(ChainId.Polygon),
        ]);
        result.hardhat = hardhat;
        result.testnet = testnet;
        result.mainnet = mainnet;
    }

    res.header('Content-Type', 'application/json').send(JSON.stringify(result, null, 4));
};
