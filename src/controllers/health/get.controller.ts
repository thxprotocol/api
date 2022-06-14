import { name, version, license } from '../../../package.json';
import { Response, Request } from 'express';
import { fromWei } from 'web3-utils';
import { getProvider } from '@/util/network';
import { ChainId } from '@/types/enums';
import InfuraService from '@/services/InfuraService';
import { diamondFacetAddresses, getContractConfig, getContractFromName } from '@/config/contracts';
import { logger } from '@/util/logger';
import newrelic from 'newrelic';
import { currentVersion, diamondVariants } from '@thxnetwork/artifacts';

function handleError(error: Error) {
    newrelic.noticeError(error);
    logger.error(error);
    return { error: 'invalid response' };
}

async function getGasTankInfo(chainId: ChainId) {
    try {
        return fromWei(await InfuraService.getAdminBalance(chainId), 'ether');
    } catch (error) {
        return handleError(error);
    }
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
        const provider = getProvider(chainId);
        const { admin, web3 } = provider;
        const balance = await web3.eth.getBalance(admin.address);

        return {
            admin: {
                address: admin.address,
                balance: fromWei(balance, 'ether'),
            },
            gasTank: {
                queue: (await InfuraService.scheduled(chainId)).length,
                address: InfuraService.getGasTank(chainId),
                balance: await getGasTankInfo(chainId),
            },
            // feeData: await getFeeData(npid),
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
            poolRegistry: getContractConfig(ChainId.PolygonMumbai, 'PoolRegistry').address,
            poolFactory: getContractConfig(ChainId.PolygonMumbai, 'PoolFactory').address,
            tokenFactory: getContractConfig(ChainId.PolygonMumbai, 'TokenFactory').address,
            feeCollector: testnetFeeCollector,
        },
        mainnet: {
            ...mainnetDetails,
            poolRegistry: poolRegistry(ChainId.Polygon).options.address,
            poolFactory: getContractConfig(ChainId.Polygon, 'PoolFactory').address,
            tokenFactory: getContractConfig(ChainId.Polygon, 'TokenFactory').address,
            feeCollector: mainnetFeeCollector,
        },
    };

    res.header('Content-Type', 'application/json').send(JSON.stringify(jsonData, null, 4));
};
