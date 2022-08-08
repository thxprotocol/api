import { name, version, license } from '../../../package.json';
import { Response, Request } from 'express';
import { fromWei } from 'web3-utils';
import { getProvider } from '@/util/network';
import { ChainId } from '@/types/enums';
import { diamondFacetAddresses, getContractConfig, getContractFromName } from '@/config/contracts';
import { logger } from '@/util/logger';
import newrelic from 'newrelic';
import { currentVersion, diamondVariants } from '@thxnetwork/artifacts';

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
        return {
            admin: {
                address: defaultAccount,
                balance: fromWei(balance, 'ether'),
            },
            relayer: relayer
                ? {
                      pending: (await relayer.list({ status: 'pending' })).length,
                      failed: (await relayer.list({ status: 'failed' })).length,
                      mined: (await relayer.list({ status: 'mined' })).length,
                  }
                : undefined,
            facets: facetAdresses(chainId),
        };
    } catch (error) {
        return handleError(error);
    }
}

function poolRegistry(chainId: ChainId) {
    const { address } = getContractConfig(chainId, 'PoolRegistry');
    return getContractFromName(chainId, 'PoolRegistry', address);
}

export const getHealth = async (_req: Request, res: Response) => {
    // #swagger.tags = ['Health']
    const [testnetDetails, mainnetDetails, testnetFeeCollector, mainnetFeeCollector] = await Promise.all([
        await getNetworkDetails(ChainId.PolygonMumbai),
        await getNetworkDetails(ChainId.Polygon),
        await poolRegistry(ChainId.PolygonMumbai).methods.feeCollector().call(),
        await poolRegistry(ChainId.Polygon).methods.feeCollector().call(),
    ]);

    const jsonData = {
        name,
        version,
        license,
        artifacts: currentVersion,
        testnet: {
            ...testnetDetails,
            registry: getContractConfig(ChainId.PolygonMumbai, 'Registry').address,
            factory: getContractConfig(ChainId.PolygonMumbai, 'Factory').address,
            feeCollector: testnetFeeCollector,
        },
        mainnet: {
            ...mainnetDetails,
            registry: getContractConfig(ChainId.Polygon, 'Registry').address,
            factory: getContractConfig(ChainId.Polygon, 'Factory').address,
            feeCollector: mainnetFeeCollector,
        },
    };

    res.header('Content-Type', 'application/json').send(JSON.stringify(jsonData, null, 4));
};
