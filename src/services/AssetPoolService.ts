import { assertEvent, parseLogs } from '@/util/events';
import { ERC20Type, NetworkProvider } from '@/types/enums';
import { AssetPool, AssetPoolDocument } from '@/models/AssetPool';
import { getProvider } from '@/util/network';
import { toChecksumAddress } from 'web3-utils';
import { Membership } from '@/models/Membership';
import { THXError } from '@/util/errors';
import TransactionService from './TransactionService';
import { diamondContracts, getContract, getContractFromName, poolFacetAdressesPermutations } from '@/config/contracts';
import { logger } from '@/util/logger';
import { pick } from '@/util';
import { diamondSelectors, getDiamondCutForContractFacets, updateDiamondContract } from '@/util/upgrades';
import { currentVersion, DiamondVariant } from '@thxnetwork/artifacts';
import ERC20Service from './ERC20Service';
import { ERC721Document } from '@/models/ERC721';
import { keccak256, toUtf8Bytes } from 'ethers/lib/utils';

export const MINTER_ROLE = keccak256(toUtf8Bytes('MINTER_ROLE'));
export const ADMIN_ROLE = '0x0000000000000000000000000000000000000000000000000000000000000000';

class NoDataAtAddressError extends THXError {
    constructor(address: string) {
        super(`No data found at address ${address}`);
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

    static getByAddress(address: string) {
        return AssetPool.findOne({ address });
    }

    static async setERC20(assetPool: AssetPoolDocument, tokenAddress: string) {
        const { web3, admin } = getProvider(assetPool.network);
        const code = await web3.eth.getCode(tokenAddress);

        if (code === '0x') {
            throw new NoDataAtAddressError(tokenAddress);
        }

        await TransactionService.send(
            assetPool.contract.options.address,
            assetPool.contract.methods.addToken(tokenAddress),
            assetPool.network,
        );

        // Try to get ERC20 from db first so we can determine its type, if not available,
        // construct a contract here
        let contract = getContractFromName(assetPool.network, 'LimitedSupplyToken', tokenAddress);
        const erc20 = await ERC20Service.findBy({ network: assetPool.network, address: tokenAddress });

        // Add this pool as a minter in case of an UnlimitedSupplyToken
        if (erc20 && erc20.type === ERC20Type.Unlimited) {
            contract = getContractFromName(assetPool.network, 'UnlimitedSupplyToken', tokenAddress);

            await TransactionService.send(
                tokenAddress,
                contract.methods.grantRole(MINTER_ROLE, assetPool.address),
                assetPool.network,
            );
        }
    }

    static async setERC721(assetPool: AssetPoolDocument, erc721: ERC721Document) {
        const { web3 } = getProvider(assetPool.network);
        const code = await web3.eth.getCode(erc721.address);

        if (code === '0x') throw new NoDataAtAddressError(erc721.address);

        await TransactionService.send(
            assetPool.contract.options.address,
            assetPool.contract.methods.setERC721(erc721.address),
            assetPool.network,
        );
        await TransactionService.send(
            erc721.contract.options.address,
            erc721.contract.methods.grantRole(MINTER_ROLE, assetPool.address),
            erc721.network,
        );
    }

    static async deploy(sub: string, network: NetworkProvider, variant: DiamondVariant = 'defaultPool') {
        const poolFactory = getContract(network, 'PoolFactory', currentVersion);
        const registry = getContract(network, 'PoolRegistry', currentVersion);
        const poolContracts = diamondContracts(network, variant);

        let deployFn;
        if (variant === 'defaultPool')
            deployFn = poolFactory.methods.deployAssetPool(
                getDiamondCutForContractFacets(poolContracts, []),
                registry.options.address,
            );
        if (variant === 'nftPool')
            deployFn = poolFactory.methods.deployNFTPool(getDiamondCutForContractFacets(poolContracts, []));

        const { receipt } = await TransactionService.send(poolFactory.options.address, deployFn, network);
        const event = assertEvent('AssetPoolDeployed', parseLogs(poolFactory.options.jsonInterface, receipt.logs));
        const assetPool = new AssetPool({
            sub,
            address: event.args.assetPool,
            blockNumber: event.blockNumber,
            transactionHash: event.transactionHash,
            bypassPolls: true,
            network: network,
            variant,
            version: currentVersion,
        });

        return assetPool;
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
