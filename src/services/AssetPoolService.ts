import { assertEvent, parseLogs } from '@/util/events';
import { ChainId, DepositState } from '@/types/enums';
import { AssetPool, AssetPoolDocument } from '@/models/AssetPool';
import { getProvider } from '@/util/network';
import { Membership } from '@/models/Membership';
import TransactionService from './TransactionService';
import { diamondContracts, getContract, poolFacetAdressesPermutations } from '@/config/contracts';
import { pick } from '@/util';
import { diamondSelectors, getDiamondCutForContractFacets, updateDiamondContract } from '@/util/upgrades';
import { currentVersion } from '@thxnetwork/artifacts';
import ERC20Service from './ERC20Service';
import ERC721Service from './ERC721Service';
import { Deposit } from '@/models/Deposit';
import { TAssetPool } from '@/types/TAssetPool';
import { ADDRESS_ZERO } from '@/config/secrets';
import { isAddress } from 'ethers/lib/utils';
import { TransactionReceipt } from 'web3-core';
import { TAssetPoolDeployCallbackArgs, TTopupCallbackArgs } from '@/types/TTransaction';

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
        erc20Address: string,
        erc721Address: string,
    ): Promise<AssetPoolDocument> {
        const factory = getContract(chainId, 'Factory', currentVersion);
        const variant = 'defaultDiamond';
        const poolFacetContracts = diamondContracts(chainId, variant);
        const pool = await AssetPool.create({
            sub,
            chainId,
            variant,
            version: currentVersion,
            archived: false,
        });
        const txId = await TransactionService.sendAsync(
            factory.options.address,
            factory.methods.deploy(getDiamondCutForContractFacets(poolFacetContracts, []), erc20Address, erc721Address),
            pool.chainId,
            true,
            {
                type: 'assetPoolDeployCallback',
                args: { erc721Address, erc20Address, chainId, assetPoolId: String(pool._id) },
            },
        );

        return AssetPool.findByIdAndUpdate(pool._id, { transactions: [txId] }, { new: true });
    }

    static async deployCallback(args: TAssetPoolDeployCallbackArgs, receipt: TransactionReceipt) {
        const { assetPoolId, chainId, erc20Address, erc721Address } = args;
        const contract = getContract(chainId, 'Factory');
        const pool = await AssetPoolService.getById(assetPoolId);
        const events = parseLogs(contract.options.jsonInterface, receipt.logs);
        const event = assertEvent('DiamondDeployed', events);
        pool.address = event.args.diamond;

        if (isAddress(erc20Address) && erc20Address !== ADDRESS_ZERO) {
            const erc20 = await ERC20Service.findOrImport(pool, erc20Address);
            await ERC20Service.initialize(pool, erc20Address); // TODO Should move to ERC20Service
            pool.erc20Id = String(erc20._id);
        }

        if (isAddress(erc721Address) && erc721Address !== ADDRESS_ZERO) {
            const erc721 = await ERC721Service.findByQuery({
                address: erc721Address,
                chainId: pool.chainId,
            });
            await ERC721Service.initialize(pool, erc721Address); // TODO Should move to ERC721Service
            pool.erc721Id = String(erc721._id);
        }

        await pool.save();
    }

    static async topup(assetPool: TAssetPool, amount: string) {
        const { defaultAccount } = getProvider(assetPool.chainId);
        const deposit = await Deposit.create({
            amount,
            sender: defaultAccount,
            receiver: assetPool.address,
            state: DepositState.Pending,
        });

        const txId = await TransactionService.sendAsync(
            assetPool.contract.options.address,
            assetPool.contract.methods.transferFrom(defaultAccount, assetPool.address, amount),
            assetPool.chainId,
            true,
            { type: 'topupCallback', args: { receiver: assetPool.address, depositId: String(deposit._id) } },
        );

        return Deposit.findByIdAndUpdate(deposit._id, { transactions: [txId] }, { new: true });
    }

    static async topupCallback({ receiver, depositId }: TTopupCallbackArgs, receipt: TransactionReceipt) {
        const pool = await AssetPoolService.getByAddress(receiver);
        const events = parseLogs(pool.contract.options.jsonInterface, receipt.logs);

        assertEvent('ERC20ProxyTransferFrom', events);

        await Deposit.findByIdAndUpdate(depositId, { state: DepositState.Completed });
    }

    static async getAllBySub(sub: string, archived = false) {
        if (archived) return AssetPool.find({ sub });
        return AssetPool.find({ sub, archived });
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
        return AssetPool.countDocuments({ chainId });
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
        const tx = await updateDiamondContract(pool.chainId, pool.contract, 'defaultDiamond', version);

        pool.version = version;

        await pool.save();

        return tx;
    }
}
