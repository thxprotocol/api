import { AssetPoolDocument, AssetPoolType } from '@/models/AssetPool';
import { ERC20Type, NetworkProvider } from '@/types/enums';
import { Membership } from '@/models/Membership';
import AssetPoolService from './AssetPoolService';
import { tokenContract } from '@/util/network';
import { fromWei } from 'web3-utils';
import ERC20Service from './ERC20Service';
import ERC20 from '@/models/ERC20';

export default class MembershipService {
    static async get(sub: string) {
        const memberships = await Membership.find({ sub });
        return memberships.map((m) => String(m._id));
    }

    static async hasMembership(assetPool: AssetPoolType, sub: string) {
        const membership = await Membership.findOne({
            sub,
            network: assetPool.network,
            poolAddress: assetPool.address,
        });

        return !!membership;
    }

    static async getById(id: string) {
        const membership = await Membership.findById(id);
        if (!membership) return null;

        let poolBalance = 0;
        const assetPool = await AssetPoolService.getByAddress(membership.poolAddress);
        if (assetPool) {
            const balanceInWei = await assetPool.contract.methods.getBalance().call();
            poolBalance = Number(fromWei(balanceInWei));
        }

        return {
            id: String(membership._id),
            poolAddress: membership.poolAddress,
            poolBalance,
            erc20: membership.erc20,
            network: membership.network,
        };
    }

    static async addMembership(sub: string, assetPool: AssetPoolDocument) {
        const membership = await Membership.findOne({
            sub,
            network: assetPool.network,
            poolAddress: assetPool.address,
        });

        if (!membership) {
            const address = await assetPool.contract.methods.getToken().call();
            let erc20 = await ERC20Service.findBy({ network: assetPool.network, address });

            if (!erc20) {
                const contract = tokenContract(assetPool.network, 'LimitedSupplyToken', address);
                const [name, symbol] = await Promise.all([
                    contract.methods.name().call(),
                    contract.methods.symbol().call(),
                ]);

                erc20 = await ERC20.create({
                    name,
                    symbol,
                    address,
                    type: ERC20Type.Unknown,
                    network: assetPool.network,
                });
            }

            await Membership.create({
                sub,
                network: assetPool.network,
                poolAddress: assetPool.address,
                erc20: String(erc20._id),
            });
        }
    }

    static async removeMembership(sub: string, assetPool: AssetPoolType) {
        const membership = await Membership.findOne({
            sub,
            network: assetPool.network,
            poolAddress: assetPool.address,
        });

        await membership.remove();
    }

    static async remove(id: string): Promise<void> {
        const membership = await Membership.findById(id);

        await membership.remove();
    }

    static countByNetwork(network: NetworkProvider) {
        return Membership.countDocuments({ network });
    }
}
