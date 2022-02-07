import { findEvent, parseLogs } from '../util/events';
import {
    callFunction,
    getAssetPoolFactory,
    NetworkProvider,
    sendTransaction,
    tokenContract,
} from '../util/network';
import { Artifacts } from '../util/artifacts';
import { POOL_REGISTRY_ADDRESS, TESTNET_POOL_REGISTRY_ADDRESS } from '../util/secrets';
import { AssetPool, IAssetPool, IAssetPoolUpdates } from '../models/AssetPool';
import { deployUnlimitedSupplyERC20Contract, deployLimitedSupplyERC20Contract, getProvider } from '../util/network';
import { toWei, fromWei } from 'web3-utils';
import { downgradeFromBypassPolls, updateToBypassPolls } from '../util/upgrades';
import { RewardDocument } from '../models/Reward';
import { IAccount } from '../models/Account';
import { Membership } from '../models/Membership';
import { ERROR_IS_NOT_MEMBER } from './MemberService';

const ERROR_NO_ASSETPOOL = 'Could not find asset pool for this address';
const ERROR_DOWNGRADE_BYPASS_POLLS = 'Could not update set bypassPolls (false) for this asset pool.';
const ERROR_UPGRADE_BYPASS_POLLS = 'Could not update set bypassPolls (true) for this asset pool.';
const ERROR_UPDATE_PROPOSE_WITHDRAW_POLL_DURATION =
    'Could not update the proposeWithdrawPollDuration for this asset pool.';
const ERROR_UPDATE_REWARD_POLL_DURATION = 'Could not update the rewardPollDuration for this asset pool.';

export default class AssetPoolService {
    static async checkAssetPoolAccess(sub: string, poolAddress: string) {
        try {
            const membership = await Membership.findOne({
                sub,
                poolAddress,
            });

            if (!membership) throw new Error(ERROR_IS_NOT_MEMBER);

            return { result: true };
        } catch (error) {
            return { error };
        }
    }

    static async canBypassRewardPoll(assetPool: IAssetPool) {
        try {
            const duration = Number(
                await callFunction(assetPool.solution.methods.getRewardPollDuration(), assetPool.network),
            );
            const canBypassPoll = assetPool.bypassPolls || (!assetPool.bypassPolls && duration === 0);
            return {
                canBypassPoll,
            };
        } catch (error) {
            return { error };
        }
    }

    static async canBypassWithdrawPoll(assetPool: IAssetPool, account: IAccount, reward: RewardDocument) {
        try {
            const { withdrawDuration } = await callFunction(
                assetPool.solution.methods.getReward(reward.id),
                assetPool.network,
            );
            const duration = Number(withdrawDuration);
            const isNotCustodial = !account.privateKey;
            const canBypassPoll =
                (assetPool.bypassPolls && isNotCustodial) ||
                (!assetPool.bypassPolls && duration === 0 && isNotCustodial);

            return {
                canBypassPoll,
            };
        } catch (error) {
            return { error };
        }
    }

    static async getByAddress(address: string) {
        try {
            const assetPool = await AssetPool.findOne({ address });

            if (!assetPool) {
                throw new Error(ERROR_NO_ASSETPOOL);
            }

            assetPool.proposeWithdrawPollDuration = Number(
                await callFunction(assetPool.solution.methods.getProposeWithdrawPollDuration(), assetPool.network),
            );
            assetPool.rewardPollDuration = Number(
                await callFunction(assetPool.solution.methods.getRewardPollDuration(), assetPool.network),
            );

            return { assetPool };
        } catch (error) {
            return { error };
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
            return { error };
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
                const { web3 } = getProvider(assetPool.network);
                const code = await web3.eth.getCode(token.address);

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

            return { tokenAddress: address };
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
            const assetPool = new AssetPool({
                sub,
                address: event.args.assetPool,
                blockNumber: event.blockNumber,
                transactionHash: event.transactionHash,
                bypassPolls: true,
                network: network,
            });

            return { assetPool };
        } catch (error) {
            return { error };
        }
    }

    static async init(assetPool: IAssetPool) {
        try {
            const { admin } = getProvider(assetPool.network);
            const poolRegistryAddress =
                assetPool.network === NetworkProvider.Test ? TESTNET_POOL_REGISTRY_ADDRESS : POOL_REGISTRY_ADDRESS;

            await sendTransaction(
                assetPool.solution.options.address,
                assetPool.solution.methods.setPoolRegistry(poolRegistryAddress),
                assetPool.network,
            );

            await sendTransaction(
                assetPool.solution.options.address,
                assetPool.solution.methods.initializeGasStation(admin.address),
                assetPool.network,
            );

            return { result: true };
        } catch (error) {
            return { error };
        }
    }

    static async getAll(sub: string) {
        try {
            return { result: (await AssetPool.find({ sub })).map((pool) => pool.address) };
        } catch (error) {
            return { error };
        }
    }

    static async removeByAddress(address: string) {
        try {
            const assetPool = await AssetPool.findOne({ address: address });
            await assetPool.remove();
            return { result: true };
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
        { proposeWithdrawPollDuration, rewardPollDuration, bypassPolls }: IAssetPoolUpdates,
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
                return { assetPool };
            } catch (error) {
                return { error: ERROR_UPDATE_REWARD_POLL_DURATION };
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
                return { assetPool };
            } catch (error) {
                return { error: ERROR_UPDATE_PROPOSE_WITHDRAW_POLL_DURATION };
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
                    throw new Error(ERROR_UPGRADE_BYPASS_POLLS);
                }
            }

            if (bypassPolls === false && assetPool.bypassPolls === true) {
                try {
                    await downgradeFromBypassPolls(assetPool);
                    assetPool.bypassPolls = bypassPolls;
                    await assetPool.save();
                } catch (error) {
                    throw new Error(ERROR_DOWNGRADE_BYPASS_POLLS);
                }
            }
            return { result: true };
        } catch (error) {
            return { error };
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
