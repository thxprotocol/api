import { findEvent, parseLogs } from '../util/events';
import { getAdmin, getAssetPoolFactory, NetworkProvider, sendTransaction, solutionContract } from '../util/network';
import { Artifacts } from '../util/artifacts';
import { POOL_REGISTRY_ADDRESS, TESTNET_POOL_REGISTRY_ADDRESS } from '../util/secrets';
import { AssetPool, IAssetPool } from '../models/AssetPool';
import { deployUnlimitedSupplyERC20Contract, deployLimitedSupplyERC20Contract, getProvider } from '../util/network';
import { toWei } from 'web3-utils';
import { HttpRequest, HttpError } from '../models/Error';
import { downgradeFromBypassPolls, updateToBypassPolls } from '../util/upgrades';

export default class AssetPoolService {
    static async getTokenAddress(assetPool: IAssetPool, token: any) {
        if (token.address) {
            const provider = getProvider(assetPool.network);
            const code = await provider.eth.getCode(token.address);

            if (code === '0x') {
                return new Error(`No data found at ERC20 address ${token.address}`);
            }

            return token.address;
        } else if (token.name && token.symbol && Number(token.totalSupply) > 0) {
            const tokenInstance = await deployLimitedSupplyERC20Contract(
                assetPool.network,
                token.name,
                token.symbol,
                assetPool.address,
                toWei(token.totalSupply),
            );
            return tokenInstance.options.address;
        } else if (token.name && token.symbol && Number(token.totalSupply) === 0) {
            const tokenInstance = await deployUnlimitedSupplyERC20Contract(
                assetPool.network,
                token.name,
                token.symbol,
                assetPool.address,
            );

            return tokenInstance.options.address;
        }
    }

    static async addToken(assetPool: IAssetPool, token: any) {
        try {
            const address = await this.getTokenAddress(assetPool, token);

            await sendTransaction(
                assetPool.solution.options.address,
                assetPool.solution.methods.addToken(address),
                assetPool.network,
            );

            return { result: true };
        } catch (error) {
            return { error };
        }
    }

    static async deploy(sub: string, network: NetworkProvider) {
        try {
            const assetPoolFactory = getAssetPoolFactory(network);
            const tx = await sendTransaction(
                assetPoolFactory.options.address,
                assetPoolFactory.methods.deployAssetPool(),
                network,
            );
            const event = findEvent('AssetPoolDeployed', parseLogs(Artifacts.IAssetPoolFactory.abi, tx.logs));

            if (!event) {
                throw new Error(
                    'Could not find a confirmation event in factory transaction. Check API health status at /v1/health.',
                );
            }
            const solution = solutionContract(network, event.args.assetPool);
            const assetPool = new AssetPool({
                address: solution.options.address,
                sub,
                blockNumber: event.blockNumber,
                transactionHash: event.transactionHash,
                bypassPolls: true,
                network: network,
            });

            assetPool.solution = solution;

            return { assetPool };
        } catch (error) {
            return { error };
        }
    }

    static async init(assetPool: IAssetPool) {
        try {
            const adminAddress = getAdmin(assetPool.network).address;
            const poolRegistryAddress =
                assetPool.network === NetworkProvider.Test ? TESTNET_POOL_REGISTRY_ADDRESS : POOL_REGISTRY_ADDRESS;
            const tx = await sendTransaction(
                assetPool.solution.options.address,
                assetPool.solution.methods.setPoolRegistry(poolRegistryAddress),
                assetPool.network,
            );

            if (!tx) {
                // check for event here
            }

            try {
                const tx = await sendTransaction(
                    assetPool.solution.options.address,
                    assetPool.solution.methods.initializeGasStation(adminAddress),
                    assetPool.network,
                );

                if (!tx) {
                    // check for event here
                }

                return { result: true };
            } catch (error) {
                return { error };
            }
        } catch (error) {
            return { error };
        }
    }

    static async getAssetPools(sub: string) {
        try {
            return { result: (await AssetPool.find({ sub: sub })).map((pool) => pool.address) };
        } catch (error) {
            return { error };
        }
    }

    static async removeAssetPoolForAddress(address: string) {
        try {
            const assetPool = await AssetPool.findOne({ address: address });
            await assetPool.remove();
        } catch (error) {
            return { error };
        }
    }

    static async findAssetPool(address: string) {
        try {
            const assetPool = await AssetPool.findOne({
                address: address,
            });
            return { assetPool };
        } catch (error) {
            return { error };
        }
    }

    static async bypassAssetPools(type: string, assetPool: IAssetPool, req: HttpRequest) {
        try {
            switch (type) {
                case 'update': {
                    await updateToBypassPolls(assetPool.network, req.solution);
                    assetPool.bypassPolls = req.body.bypassPolls;

                    await assetPool.save();
                }
                case 'downgrade': {
                    await downgradeFromBypassPolls(assetPool.network, req.solution);
                    assetPool.bypassPolls = req.body.bypassPolls;

                    await assetPool.save();
                }
            }
        } catch (error) {
            return { error };
        }
    }
}
