import { assertEvent, parseLogs } from '@/util/events';
import { getAssetPoolFactory, NetworkProvider, tokenContract } from '@/util/network';
import { Artifacts } from '@/util/artifacts';
import { POOL_REGISTRY_ADDRESS, TESTNET_POOL_REGISTRY_ADDRESS } from '@/util/secrets';
import { AssetPool, AssetPoolDocument, IAssetPoolUpdates } from '@/models/AssetPool';
import { deployUnlimitedSupplyERC20Contract, deployLimitedSupplyERC20Contract, getProvider } from '@/util/network';
import { toWei, fromWei } from 'web3-utils';
import { downgradeFromBypassPolls, updateToBypassPolls } from '@/util/upgrades';
import { TReward } from '@/models/Reward';
import { IAccount } from '@/models/Account';
import { Membership } from '@/models/Membership';
import { THXError } from '@/util/errors';
import { TransactionService } from './TransactionService';
import { getPoolFacetAdressesPermutations } from '@/util/networkconfig';

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
            await TransactionService.call(assetPool.solution.methods.getRewardPollDuration(), assetPool.network),
        );
        return !assetPool.bypassPolls && duration === 0;
    }

    static async canBypassWithdrawPoll(assetPool: AssetPoolDocument, account: IAccount, reward: TReward) {
        // Early return to not call function when not needed.
        const isNotCustodial = !account.privateKey;
        if (assetPool.bypassPolls && isNotCustodial) return true;

        const { withdrawDuration } = await TransactionService.call(
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
            await TransactionService.call(
                assetPool.solution.methods.getProposeWithdrawPollDuration(),
                assetPool.network,
            ),
        );
        assetPool.rewardPollDuration = Number(
            await TransactionService.call(assetPool.solution.methods.getRewardPollDuration(), assetPool.network),
        );

        return assetPool;
    }

    static async getPoolToken(assetPool: AssetPoolDocument) {
        const tokenAddress = await TransactionService.call(assetPool.solution.methods.getToken(), assetPool.network);
        const tokenInstance = tokenContract(assetPool.network, tokenAddress);

        return {
            address: tokenInstance.options.address,
            //can we do these calls in parallel?
            name: await TransactionService.call(tokenInstance.methods.name(), assetPool.network),
            symbol: await TransactionService.call(tokenInstance.methods.symbol(), assetPool.network),
            totalSupply: Number(
                fromWei(await TransactionService.call(tokenInstance.methods.totalSupply(), assetPool.network)),
            ),
            balance: Number(
                fromWei(
                    await TransactionService.call(
                        tokenInstance.methods.balanceOf(assetPool.address),
                        assetPool.network,
                    ),
                ),
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

        await TransactionService.send(
            assetPool.solution.options.address,
            assetPool.solution.methods.addToken(tokenAddress),
            assetPool.network,
        );

        return tokenAddress;
    }

    static async deploy(sub: string, network: NetworkProvider) {
        const assetPoolFactory = getAssetPoolFactory(network);
        const tx = await TransactionService.send(
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

        await TransactionService.send(
            assetPool.solution.options.address,
            assetPool.solution.methods.setPoolRegistry(poolRegistryAddress),
            assetPool.network,
        );

        await TransactionService.send(
            assetPool.solution.options.address,
            assetPool.solution.methods.initializeGasStation(admin.address),
            assetPool.network,
        );
    }

    static async getAllBySub(sub: string) {
        return (await AssetPool.find({ sub })).map((pool) => pool.address);
    }

    static getAll() {
        return AssetPool.find({});
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
            await TransactionService.send(
                assetPool.solution.options.address,
                assetPool.solution.methods.setRewardPollDuration(rewardPollDuration),
                assetPool.network,
            );
            assetPool.rewardPollDuration = rewardPollDuration;
            await assetPool.save();
            return assetPool;
        }

        async function updateProposeWithdrawPollDuration() {
            await TransactionService.send(
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
