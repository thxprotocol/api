import { findEvent, parseLogs } from '../util/events';
import {
    callFunction,
    getAdmin,
    getAssetPoolFactory,
    NetworkProvider,
    sendTransaction,
    solutionContract,
    tokenContract,
} from '../util/network';
import { Artifacts } from '../util/artifacts';
import { POOL_REGISTRY_ADDRESS, TESTNET_POOL_REGISTRY_ADDRESS } from '../util/secrets';
import { AssetPool, IAssetPool } from '../models/AssetPool';
import { deployUnlimitedSupplyERC20Contract, deployLimitedSupplyERC20Contract, getProvider } from '../util/network';
import { toWei, fromWei } from 'web3-utils';
import { downgradeFromBypassPolls, updateToBypassPolls } from '../util/upgrades';

const ERROR_NO_ASSETPOOL = 'Could not find asset pool for this address';

export default class AssetPoolService {
    static async getByAddress(address: string) {
        try {
            const assetPool = await AssetPool.findOne({ address });
            assetPool.solution = solutionContract(assetPool.network, address);

            if (!assetPool) {
                throw new Error(ERROR_NO_ASSETPOOL);
            }

            const proposeWithdrawPollDuration = Number(
                await callFunction(assetPool.solution.methods.getProposeWithdrawPollDuration(), assetPool.network),
            );
            const rewardPollDuration = Number(
                await callFunction(assetPool.solution.methods.getRewardPollDuration(), assetPool.network),
            );

            return {
                assetPool: {
                    sub: assetPool.sub,
                    rat: assetPool.rat,
                    address: assetPool.address,
                    network: assetPool.network,
                    bypassPolls: assetPool.bypassPolls,
                    proposeWithdrawPollDuration,
                    rewardPollDuration,
                },
            };
        } catch (error) {
            return error;
        }
    }

    static async getPoolToken(assetPool: IAssetPool) {
        try {
            const tokenAddress = await callFunction(assetPool.solution.methods.getToken(), assetPool.network);
            const tokenInstance = tokenContract(assetPool.network, tokenAddress);

            return {
                token: {
                    address: tokenInstance.options.address,
                    name: await callFunction(tokenInstance.methods.name(), assetPool.network),
                    symbol: await callFunction(tokenInstance.methods.symbol(), assetPool.network),
                    totalSupply: Number(
                        fromWei(await callFunction(tokenInstance.methods.totalSupply(), assetPool.network)),
                    ),
                    balance: Number(
                        fromWei(
                            await callFunction(tokenInstance.methods.balanceOf(assetPool.address), assetPool.network),
                        ),
                    ),
                },
            };
        } catch (error) {
            return error;
        }
    }

    static async deployPoolToken(assetPool: IAssetPool, token: any) {
        if (token.name && token.symbol && Number(token.totalSupply) > 0) {
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

    static async addPoolToken(assetPool: IAssetPool, token: any) {
        try {
            if (token.address) {
                const provider = getProvider(assetPool.network);
                const code = await provider.eth.getCode(token.address);

                if (code === '0x') {
                    throw new Error(`No data found at ERC20 address ${token.address}`);
                }
            }

            const address = token.address || (await this.deployPoolToken(assetPool, token));

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

    static async getAll(sub: string) {
        try {
            return { result: (await AssetPool.find({ sub: sub })).map((pool) => pool.address) };
        } catch (error) {
            return { error };
        }
    }

    static async removeByAddress(address: string) {
        try {
            const assetPool = await AssetPool.findOne({ address: address });
            await assetPool.remove();
        } catch (error) {
            return { error };
        }
    }

    static async findByAddress(address: string) {
        try {
            const assetPool = await AssetPool.findOne({
                address: address,
            });
            return { assetPool };
        } catch (error) {
            return { error };
        }
    }

    static async update(
        assetPool: IAssetPool,
        {
            proposeWithdrawPollDuration,
            rewardPollDuration,
            bypassPolls,
        }: { proposeWithdrawPollDuration: number; rewardPollDuration: number; bypassPolls?: boolean },
    ) {
        async function updateRewardPollDuration() {
            try {
                await sendTransaction(
                    assetPool.solution.options.address,
                    assetPool.solution.methods.setRewardPollDuration(rewardPollDuration),
                    assetPool.network,
                );
                assetPool.rewardPollDuration = rewardPollDuration;
                await assetPool.save();
            } catch (error) {
                return { error: 'Could not update the rewardPollDuration for this asset pool.' };
            }
        }

        async function updateProposeWithdrawPollDuration() {
            try {
                await sendTransaction(
                    assetPool.solution.options.address,
                    assetPool.solution.methods.setProposeWithdrawPollDuration(proposeWithdrawPollDuration),
                    assetPool.network,
                );
                assetPool.proposeWithdrawPollDuration = proposeWithdrawPollDuration;
                await assetPool.save();
            } catch (error) {
                return { error: 'Could not update the proposeWithdrawPollDuration for this asset pool.' };
            }
        }

        try {
            if (rewardPollDuration && assetPool.rewardPollDuration !== rewardPollDuration) {
                const { error } = await updateRewardPollDuration();
                if (error) throw new Error(error);
            }

            if (proposeWithdrawPollDuration && assetPool.proposeWithdrawPollDuration !== proposeWithdrawPollDuration) {
                const { error } = await updateProposeWithdrawPollDuration();
                if (error) throw new Error(error);
            }

            if (bypassPolls === true && assetPool.bypassPolls === false) {
                try {
                    await updateToBypassPolls(assetPool);
                    assetPool.bypassPolls = bypassPolls;
                    await assetPool.save();
                } catch (error) {
                    throw new Error('Could not update set bypassPolls (true) for this asset pool.');
                }
            }

            if (bypassPolls === false && assetPool.bypassPolls === true) {
                try {
                    await downgradeFromBypassPolls(assetPool);
                    assetPool.bypassPolls = bypassPolls;
                    await assetPool.save();
                } catch (error) {
                    throw new Error('Could not update set bypassPolls (false) for this asset pool.');
                }
            }

            return { assetPool };
        } catch (error) {
            throw { error };
        }
    }

    static async getByClient(clientId: string) {
        try {
            const assetPools = await AssetPool.find({ aud: clientId });
            return { assetPools };
        } catch (error) {
            return { error };
        }
    }

    static async findByNetwork(network: number) {
        try {
            const assetPools = await AssetPool.find({ network });
            return { assetPools };
        } catch (error) {
            return { error };
        }
    }

    static async countByNetwork(network: NetworkProvider) {
        try {
            return await AssetPool.countDocuments({ network });
        } catch (error) {
            return { error };
        }
    }
}
