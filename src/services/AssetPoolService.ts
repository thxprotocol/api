import { CustomEventLog, findEvent } from '@/util/events';
import { NetworkProvider } from '@/types/enums';
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

export const ADMIN_ROLE = '0x0000000000000000000000000000000000000000000000000000000000000000';

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

    static getById(id: string) {
        return AssetPool.findById(id);
    }

    static getByAddress(address: string) {
        return AssetPool.findOne({ address });
    }

    static async deploy(
        sub: string,
        network: NetworkProvider,
        variant: DiamondVariant = 'defaultPool',
        tokenAddress: string,
    ): Promise<AssetPoolDocument> {
        const poolFactory = getContract(network, 'PoolFactory', currentVersion);
        const registry = getContract(network, 'PoolRegistry', currentVersion);
        const poolFacetContracts = diamondContracts(network, variant);
        const pool = new AssetPool({
            sub,
            network: network,
            variant,
            version: currentVersion,
        });

        let fn, args;
        if (variant === 'defaultPool') {
            fn = 'deployDefaultPool';
            args = [getDiamondCutForContractFacets(poolFacetContracts, []), registry.options.address, tokenAddress];
        }

        if (variant === 'nftPool') {
            fn = 'deployNFTPool';
            args = [getDiamondCutForContractFacets(poolFacetContracts, []), tokenAddress];
        }

        const callback = async (tx: TransactionDocument, events?: CustomEventLog[]): Promise<AssetPoolDocument> => {
            if (events) {
                const event = findEvent('PoolDeployed', events);
                pool.address = event.args.pool;
            }
            pool.transactions.push(String(tx._id));

            return await pool.save();
        };

        return await TransactionService.relay(poolFactory, fn, args, network, callback);
    }

    static async getAllBySub(sub: string) {
        return await AssetPool.find({ sub });
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

    static async countByNetwork(network: NetworkProvider) {
        return await AssetPool.countDocuments({ network });
    }

    static async contractVersionVariant(assetPool: AssetPoolDocument) {
        const permutations = Object.values(poolFacetAdressesPermutations(assetPool.network));
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
        const tx = await updateDiamondContract(pool.network, pool.contract, pool.variant, version);

        pool.version = version;

        await pool.save();

        return tx;
    }

    static async transferOwnership(assetPool: AssetPoolDocument, currentPrivateKey: string, newPrivateKey: string) {
        const { web3 } = getProvider(assetPool.network);
        const currentOwner = web3.eth.accounts.privateKeyToAccount(currentPrivateKey);
        const currentOwnerAddress = toChecksumAddress(currentOwner.address);
        const newOwner = web3.eth.accounts.privateKeyToAccount(newPrivateKey);
        const newOwnerAddress = toChecksumAddress(newOwner.address);

        const { methods, options } = assetPool.contract;

        const sendFromCurrentOwner = (fn: any) => {
            return TransactionService.send(options.address, fn, assetPool.network, null, currentPrivateKey);
        };
        const sendFromNewOwner = (fn: any) => {
            return TransactionService.send(options.address, fn, assetPool.network, null, newPrivateKey);
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
