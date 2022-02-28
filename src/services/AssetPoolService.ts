import { assertEvent, parseLogs } from '@/util/events';
import { callFunction, getAssetPoolFactory, NetworkProvider, sendTransaction, tokenContract } from '@/util/network';
import { Artifacts } from '@/util/artifacts';
import { POOL_REGISTRY_ADDRESS, TESTNET_POOL_REGISTRY_ADDRESS } from '@/util/secrets';
import { AssetPool, AssetPoolDocument, IAssetPoolUpdates } from '@/models/AssetPool';
import { deployUnlimitedSupplyERC20Contract, deployLimitedSupplyERC20Contract, getProvider } from '@/util/network';
import { toWei, fromWei } from 'web3-utils';
import { downgradeFromBypassPolls, updateToBypassPolls } from '@/util/upgrades';
import { RewardDocument } from '@/models/Reward';
import { IAccount } from '@/models/Account';
import { Membership } from '@/models/Membership';
import { THXError } from '@/util/errors';

class NoDataAtAddressError extends THXError {
    constructor(address: string) {
        super(`No data found at ERC20 address ${address}`);
    }
}

export default class AssetPoolService {
    static getByClientIdAndAddress(clientId: string, address: string) {
        return AssetPool.find({ clientId, address });
    }

    static isAssetPoolMember(sub: string, poolAddress: string) {
        return Membership.exists({
            sub,
            poolAddress,
        });
    }

    static async canBypassRewardPoll(assetPool: AssetPoolDocument) {
        // Early return to not call function when not needed.
        if (assetPool.bypassPolls) return true;

        const duration = Number(
            await callFunction(assetPool.solution.methods.getRewardPollDuration(), assetPool.network),
        );
        return !assetPool.bypassPolls && duration === 0;
    }

    static async canBypassWithdrawPoll(assetPool: AssetPoolDocument, account: IAccount, reward: RewardDocument) {
        // Early return to not call function when not needed.
        const isNotCustodial = !account.privateKey;
        if (assetPool.bypassPolls && isNotCustodial) return true;

        const { withdrawDuration } = await callFunction(
            assetPool.solution.methods.getReward(reward.id),
            assetPool.network,
        );
        const duration = Number(withdrawDuration);
        return !assetPool.bypassPolls && duration === 0 && isNotCustodial;
    }

    static async getByAddress(address: string) {
        const assetPool = await AssetPool.findOne({ address });

        if (!assetPool) {
            return null;
        }

        assetPool.proposeWithdrawPollDuration = Number(
            await callFunction(assetPool.solution.methods.getProposeWithdrawPollDuration(), assetPool.network),
        );
        assetPool.rewardPollDuration = Number(
            await callFunction(assetPool.solution.methods.getRewardPollDuration(), assetPool.network),
        );

        return assetPool;
    }

    static async getPoolToken(assetPool: AssetPoolDocument) {
        const tokenAddress = await callFunction(assetPool.solution.methods.getToken(), assetPool.network);
        const tokenInstance = tokenContract(assetPool.network, tokenAddress);

        return {
            address: tokenInstance.options.address,
            //can we do these calls in parallel?
            name: await callFunction(tokenInstance.methods.name(), assetPool.network),
            symbol: await callFunction(tokenInstance.methods.symbol(), assetPool.network),
            totalSupply: Number(fromWei(await callFunction(tokenInstance.methods.totalSupply(), assetPool.network))),
            balance: Number(
                fromWei(await callFunction(tokenInstance.methods.balanceOf(assetPool.address), assetPool.network)),
            ),
        };
    }

    static async deployPoolToken(assetPool: AssetPoolDocument, token: any) {
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

    static async addPoolToken(assetPool: AssetPoolDocument, token: any) {
        if (token.address) {
            const { web3 } = getProvider(assetPool.network);
            const code = await web3.eth.getCode(token.address);

            if (code === '0x') {
                throw new NoDataAtAddressError(token.address);
            }
        }

        const tokenAddress = token.address || (await this.deployPoolToken(assetPool, token));

        await sendTransaction(
            assetPool.solution.options.address,
            assetPool.solution.methods.addToken(tokenAddress),
            assetPool.network,
        );

        return tokenAddress;
    }

    static async deploy(sub: string, network: NetworkProvider) {
        const assetPoolFactory = getAssetPoolFactory(network);
        const tx = await sendTransaction(
            assetPoolFactory.options.address,
            assetPoolFactory.methods.deployAssetPool(),
            network,
        );
        const event = assertEvent('AssetPoolDeployed', parseLogs(Artifacts.IAssetPoolFactory.abi, tx.logs));

        const assetPool = new AssetPool({
            sub,
            address: event.args.assetPool,
            blockNumber: event.blockNumber,
            transactionHash: event.transactionHash,
            bypassPolls: true,
            network: network,
        });

        return assetPool;
    }

    static async init(assetPool: AssetPoolDocument) {
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
    }

    static async getAll(sub: string) {
        return (await AssetPool.find({ sub })).map((pool) => pool.address);
    }

    static async removeByAddress(address: string) {
        const assetPool = await AssetPool.findOne({ address: address });
        await assetPool.remove();
    }

    static findByAddress(address: string) {
        return AssetPool.findOne({
            address: address,
        });
    }

    static async update(
        assetPool: AssetPoolDocument,
        { proposeWithdrawPollDuration, rewardPollDuration, bypassPolls }: IAssetPoolUpdates,
    ) {
        async function updateRewardPollDuration() {
            await sendTransaction(
                assetPool.solution.options.address,
                assetPool.solution.methods.setRewardPollDuration(rewardPollDuration),
                assetPool.network,
            );
            assetPool.rewardPollDuration = rewardPollDuration;
            await assetPool.save();
            return assetPool;
        }

        async function updateProposeWithdrawPollDuration() {
            await sendTransaction(
                assetPool.solution.options.address,
                assetPool.solution.methods.setProposeWithdrawPollDuration(proposeWithdrawPollDuration),
                assetPool.network,
            );
            assetPool.proposeWithdrawPollDuration = proposeWithdrawPollDuration;
            await assetPool.save();
            return assetPool;
        }

        if (rewardPollDuration && assetPool.rewardPollDuration !== rewardPollDuration) {
            await updateRewardPollDuration();
        }

        if (proposeWithdrawPollDuration && assetPool.proposeWithdrawPollDuration !== proposeWithdrawPollDuration) {
            await updateProposeWithdrawPollDuration();
        }

        if (bypassPolls === true && assetPool.bypassPolls === false) {
            await updateToBypassPolls(assetPool);
            assetPool.bypassPolls = bypassPolls;
            await assetPool.save();
        }

        if (bypassPolls === false && assetPool.bypassPolls === true) {
            await downgradeFromBypassPolls(assetPool);
            assetPool.bypassPolls = bypassPolls;
            await assetPool.save();
        }
    }

    static async countByNetwork(network: NetworkProvider) {
        return await AssetPool.countDocuments({ network });
    }
}
