import { assertEvent, parseLogs } from '@/util/events';
import { getAssetPoolFactory, tokenContract } from '@/util/network';
import { NetworkProvider } from '@/types/enums';
import { Artifacts } from '@/config/contracts/artifacts';
import { AssetPool, AssetPoolDocument } from '@/models/AssetPool';
import { deployUnlimitedSupplyERC20Contract, deployLimitedSupplyERC20Contract, getProvider } from '@/util/network';
import { toWei, fromWei, toChecksumAddress } from 'web3-utils';

import { Membership } from '@/models/Membership';
import { THXError } from '@/util/errors';
import TransactionService from './TransactionService';
import { assetPoolRegistryAddress, poolFacetAdressesPermutations } from '@/config/contracts';
import { logger } from '@/util/logger';

export const ADMIN_ROLE = '0x0000000000000000000000000000000000000000000000000000000000000000';
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

    static getByAddress(address: string) {
        return AssetPool.findOne({ address });
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
        const poolRegistryAddress = assetPoolRegistryAddress(assetPool.network);

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

    static async countByNetwork(network: NetworkProvider) {
        return await AssetPool.countDocuments({ network });
    }

    static async contractVersion(assetPool: AssetPoolDocument) {
        const permutations = Object.values(poolFacetAdressesPermutations(assetPool.network));
        const facetAddresses = [...(await assetPool.solution.methods.facetAddresses().call())];
        const match = permutations.find(
            (permutation) => Object.values(permutation.facets).sort().join('') === facetAddresses.sort().join(''),
        );
        return match ? match.version : 'unknown';
    }

    static async transferOwnership(assetPool: AssetPoolDocument, currentPrivateKey: string, newPrivateKey: string) {
        const { web3 } = getProvider(assetPool.network);
        const currentOwner = web3.eth.accounts.privateKeyToAccount(currentPrivateKey);
        const currentOwnerAddress = toChecksumAddress(currentOwner.address);
        const newOwner = web3.eth.accounts.privateKeyToAccount(newPrivateKey);
        const newOwnerAddress = toChecksumAddress(newOwner.address);

        const { methods, options } = assetPool.solution;

        const sendFromCurrentOwner = (fn: any) => {
            return TransactionService.send(options.address, fn, assetPool.network, null, currentPrivateKey);
        };
        const sendFromNewOwner = (fn: any) => {
            return TransactionService.send(options.address, fn, assetPool.network, null, newPrivateKey);
        };

        // Transfer gas station to new account
        if (toChecksumAddress(await methods.getGasStationAdmin().call()) !== newOwnerAddress) {
            // Init gas station
            const tx = await sendFromCurrentOwner(methods.initializeGasStation(newOwnerAddress));
            logger.debug('Gas station transferred to new owner:', assetPool.address, tx.transactionHash);
        }

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
            const tx = await sendFromCurrentOwner(methods.transferOwnership(newOwner.address));
            logger.debug('TransferOwnership:', assetPool.address, tx.transactionHash);
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
