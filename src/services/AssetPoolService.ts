import { assertEvent, CustomEventLog, findEvent } from '@/util/events';
import { ChainId, DepositState, ERC20Type } from '@/types/enums';
import { AssetPool, AssetPoolDocument } from '@/models/AssetPool';
import { getProvider } from '@/util/network';
import { Membership } from '@/models/Membership';
import TransactionService from './TransactionService';
import { diamondContracts, getContract, poolFacetAdressesPermutations } from '@/config/contracts';
import { pick } from '@/util';
import { diamondSelectors, getDiamondCutForContractFacets, updateDiamondContract } from '@/util/upgrades';
import { currentVersion } from '@thxnetwork/artifacts';
import { TransactionDocument } from '@/models/Transaction';
import MembershipService from './MembershipService';
import ERC20Service from './ERC20Service';
import ERC721Service from './ERC721Service';
import { Deposit } from '@/models/Deposit';
import { TAssetPool } from '@/types/TAssetPool';

export const ADMIN_ROLE = '0x0000000000000000000000000000000000000000000000000000000000000000';

export default class AssetPoolService {
    static isPoolClient(clientId: string, poolId: string) {
        return AssetPool.exists({ _id: poolId, clientId });
    }

    static isPoolMember(sub: string, poolId: string) {
        return Membership.exists({
            sub,
            poolId,
        });
    }

    static isPoolOwner(sub: string, poolId: string) {
        return AssetPool.exists({
            _id: poolId,
            sub,
        });
    }

    static getById(id: string) {
        return AssetPool.findById(id);
    }

    static getByAddress(address: string) {
        return AssetPool.findOne({ address });
    }

    static async deploy(
        sub: string,
        chainId: ChainId,
        erc20: string[],
        erc721: string[] = [],
    ): Promise<AssetPoolDocument> {
        const poolFactory = getContract(chainId, 'Factory', currentVersion);
        const registry = getContract(chainId, 'Registry', currentVersion);
        const poolFacetContracts = diamondContracts(chainId, 'defaultDiamond');
        const pool = new AssetPool({
            sub,
            chainId,
            variant: 'defaultDiamond',
            version: currentVersion,
            archived: false,
        });

        const { fn, args, callback } = {
            fn: 'deploy',
            args: [getDiamondCutForContractFacets(poolFacetContracts, []), registry.options.address, erc20, erc721],
            callback: async (tx: TransactionDocument, events?: CustomEventLog[]): Promise<AssetPoolDocument> => {
                if (events) {
                    const event = findEvent('DiamondDeployed', events);
                    pool.address = event.args.diamond;

                    if (erc20.length) {
                        await AssetPoolService.initializeERC20(pool, erc20[0]); // TODO Should move to ERC20Service
                    }
                    if (erc721.length) {
                        await AssetPoolService.initializeERC721(pool, erc721[0]); // TODO Should move to ERC721Service
                    }
                }
                pool.transactions.push(String(tx._id));

                return await pool.save();
            },
        };

        return await TransactionService.relay(poolFactory, fn, args, pool.chainId, callback);
    }

    static async topup(assetPool: TAssetPool, amount: string) {
        const { defaultAccount } = getProvider(assetPool.chainId);
        const deposit = await Deposit.create({
            amount,
            sender: defaultAccount,
            receiver: assetPool.address,
            state: DepositState.Pending,
        });

        return await TransactionService.relay(
            assetPool.contract,
            'transferFrom',
            [defaultAccount, assetPool.address, amount],
            assetPool.chainId,
            async (tx: TransactionDocument, events: CustomEventLog[]) => {
                if (events) {
                    assertEvent('ERC20TransferFrom', events);
                    deposit.state = DepositState.Completed;
                }

                deposit.transactions.push(String(tx._id));

                return await deposit.save();
            },
        );
    }

    static async initializeERC20(pool: AssetPoolDocument, tokenAddress: string) {
        const erc20 = await ERC20Service.findBy({ chainId: pool.chainId, address: tokenAddress, sub: pool.sub });
        if (erc20 && erc20.type === ERC20Type.Unlimited) {
            await ERC20Service.addMinter(erc20, pool.address);
        }
        await MembershipService.addERC20Membership(pool.sub, pool);
    }

    static async initializeERC721(pool: AssetPoolDocument, tokenAddress: string) {
        const erc721 = await ERC721Service.findByQuery({ address: tokenAddress, chainId: pool.chainId });

        await ERC721Service.addMinter(erc721, pool.address);
        await MembershipService.addERC721Membership(pool.sub, pool);
    }

    static async getAllBySub(sub: string, archived = false) {
        if (archived) return await AssetPool.find({ sub });
        return await AssetPool.find({ sub, archived });
    }

    static getAll() {
        return AssetPool.find({});
    }

    static remove(pool: AssetPoolDocument) {
        return AssetPool.deleteOne({ _id: String(pool._id) });
    }

    static findByAddress(address: string) {
        return AssetPool.findOne({
            address: address,
        });
    }

    static async countByNetwork(chainId: ChainId) {
        return await AssetPool.countDocuments({ chainId });
    }

    static async contractVersionVariant(assetPool: AssetPoolDocument) {
        const permutations = Object.values(poolFacetAdressesPermutations(assetPool.chainId));
        const facets = await assetPool.contract.methods.facets().call();

        const facetAddresses = facets
            .filter((facet: any) => !facet.functionSelectors.every((sel: string) => diamondSelectors.includes(sel)))
            .map((facet: any) => facet.facetAddress);

        const match = permutations.find(
            (permutation) => permutation.facetAddresses.sort().join('') === facetAddresses.sort().join(''),
        );
        return match ? pick(match, ['version', 'variant']) : { version: 'unknown', variant: 'unknown' };
    }

    static async updateAssetPool(pool: AssetPoolDocument, version?: string) {
        const tx = await updateDiamondContract(pool.chainId, pool.contract, pool.variant, version);

        pool.version = version;

        await pool.save();

        return tx;
    }
}
