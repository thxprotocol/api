import { assertEvent, CustomEventLog, findEvent } from '@/util/events';
import { ChainId, DepositState, ERC20Type } from '@/types/enums';
import { AssetPool, AssetPoolDocument } from '@/models/AssetPool';
import { getProvider } from '@/util/network';
import { toChecksumAddress } from 'web3-utils';
import { Membership } from '@/models/Membership';
import TransactionService from './TransactionService';
import { diamondContracts, getContract, poolFacetAdressesPermutations } from '@/config/contracts';
import { logger } from '@/util/logger';
import { pick } from '@/util';
import { diamondSelectors, getDiamondCutForContractFacets, updateDiamondContract } from '@/util/upgrades';
import { currentVersion, DiamondVariant } from '@thxnetwork/artifacts';
import { TransactionDocument } from '@/models/Transaction';
import MembershipService from './MembershipService';
import ERC20Service from './ERC20Service';
import ERC721Service from './ERC721Service';
import { Deposit } from '@/models/Deposit';
import { TAssetPool } from '@/types/TAssetPool';
import { Contract } from 'web3-eth-contract';

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
        variant: DiamondVariant = 'defaultPool',
        tokens: string[],
    ): Promise<AssetPoolDocument> {
        const poolFactory = getContract(chainId, 'PoolFactory', currentVersion);
        const registry = getContract(chainId, 'PoolRegistry', currentVersion);
        const poolFacetContracts = diamondContracts(chainId, variant);
        const pool = new AssetPool({
            sub,
            chainId,
            variant,
            version: currentVersion,
            archived: false,
        });
        const { fn, args, callback } = await this.getDeployFnArgsCallback(registry, poolFacetContracts, tokens, pool);

        return await TransactionService.relay(poolFactory, fn, args, pool.chainId, callback);
    }

    static async getDeployFnArgsCallback(
        registry: Contract,
        poolFacetContracts: Contract[],
        tokens: string[],
        pool: AssetPoolDocument,
    ) {
        switch (pool.variant) {
            case 'defaultPool': {
                await ERC20Service.findOrImport(pool, tokens[0]);
                return {
                    fn: 'deployDefaultPool',
                    args: [getDiamondCutForContractFacets(poolFacetContracts, []), registry.options.address, tokens[0]],
                    callback: async (
                        tx: TransactionDocument,
                        events?: CustomEventLog[],
                    ): Promise<AssetPoolDocument> => {
                        if (events) {
                            const event = findEvent('PoolDeployed', events);
                            pool.address = event.args.pool;

                            await AssetPoolService.initializeDefaultPool(pool, tokens[0]);
                        }
                        pool.transactions.push(String(tx._id));

                        return await pool.save();
                    },
                };
            }
            case 'nftPool': {
                return {
                    fn: 'deployNFTPool',
                    args: [getDiamondCutForContractFacets(poolFacetContracts, []), tokens[0]],
                    callback: async (
                        tx: TransactionDocument,
                        events?: CustomEventLog[],
                    ): Promise<AssetPoolDocument> => {
                        if (events) {
                            const event = findEvent('PoolDeployed', events);
                            pool.address = event.args.pool;

                            await AssetPoolService.initializeNFTPool(pool, tokens[0]);
                        }
                        pool.transactions.push(String(tx._id));

                        return await pool.save();
                    },
                };
            }
        }
    }

    static async topup(assetPool: TAssetPool, amount: string) {
        const { admin } = getProvider(assetPool.chainId);
        const deposit = await Deposit.create({
            amount,
            sender: admin.address,
            receiver: assetPool.address,
            state: DepositState.Pending,
        });

        return await TransactionService.relay(
            assetPool.contract,
            'topup',
            [amount],
            assetPool.chainId,
            async (tx: TransactionDocument, events: CustomEventLog[]) => {
                if (events) {
                    assertEvent('Topup', events);
                    deposit.state = DepositState.Completed;
                }

                deposit.transactions.push(String(tx._id));

                return await deposit.save();
            },
        );
    }

    static async initializeDefaultPool(pool: AssetPoolDocument, tokenAddress: string) {
        const erc20 = await ERC20Service.findBy({ chainId: pool.chainId, address: tokenAddress, sub: pool.sub });
        if (erc20 && erc20.type === ERC20Type.Unlimited) {
            await ERC20Service.addMinter(erc20, pool.address);
        }
        await MembershipService.addERC20Membership(pool.sub, pool);
    }

    static async initializeNFTPool(pool: AssetPoolDocument, tokenAddress: string) {
        const erc721 = await ERC721Service.findByQuery({ address: tokenAddress, chainId: pool.chainId });

        await ERC721Service.addMinter(erc721, pool.address);
        await MembershipService.addERC721Membership(pool.sub, pool);
    }

    static async getAllBySub(sub: string) {
        return await AssetPool.find({ sub });
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

    static async transferOwnership(assetPool: AssetPoolDocument, currentPrivateKey: string, newPrivateKey: string) {
        const { web3 } = getProvider(assetPool.chainId);
        const currentOwner = web3.eth.accounts.privateKeyToAccount(currentPrivateKey);
        const currentOwnerAddress = toChecksumAddress(currentOwner.address);
        const newOwner = web3.eth.accounts.privateKeyToAccount(newPrivateKey);
        const newOwnerAddress = toChecksumAddress(newOwner.address);

        const { methods, options } = assetPool.contract;

        const sendFromCurrentOwner = (fn: any) => {
            return TransactionService.send(options.address, fn, assetPool.chainId, null, currentPrivateKey);
        };
        const sendFromNewOwner = (fn: any) => {
            return TransactionService.send(options.address, fn, assetPool.chainId, null, newPrivateKey);
        };

        // Add membership, manager and admin role to new owner.
        if (!(await methods.isMember(newOwnerAddress).call())) {
            logger.debug('Adding new owner to members');
            await sendFromCurrentOwner(methods.addMember(newOwnerAddress));
        }
        if (!(await methods.isManager(newOwnerAddress).call())) {
            logger.debug('Adding new owner to managers');
            await sendFromCurrentOwner(methods.addManager(newOwnerAddress));
        }
        if (!(await methods.hasRole(ADMIN_ROLE, newOwner.address).call())) {
            logger.debug('Granting new owner admin role');
            await sendFromCurrentOwner(methods.grantRole(ADMIN_ROLE, newOwner.address));
        }

        // Transfer ownership.
        if (toChecksumAddress(await methods.owner().call()) !== newOwnerAddress) {
            // Transfer ownership
            const { receipt } = await sendFromCurrentOwner(methods.transferOwnership(newOwner.address));
            logger.debug('TransferOwnership:', assetPool.address, receipt.transactionHash);
        }

        // Remove admin role, manager and membership from former owner.
        if (await methods.hasRole(ADMIN_ROLE, currentOwnerAddress).call()) {
            logger.debug('Remove former owners admin role');
            await sendFromNewOwner(methods.revokeRole(ADMIN_ROLE, currentOwner.address));
        }
        if (await methods.isManager(currentOwnerAddress).call()) {
            logger.debug('Removing former owner from managers');
            await sendFromNewOwner(methods.removeManager(currentOwnerAddress));
        }
        if (await methods.isMember(currentOwnerAddress).call()) {
            logger.debug('Remove former owner from members');
            await sendFromNewOwner(methods.removeMember(currentOwnerAddress));
        }
    }
}
