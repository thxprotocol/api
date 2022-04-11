import { AssetPoolType } from '@/models/AssetPool';
import { NetworkProvider } from '@/types/enums';
import { Membership } from '@/models/Membership';
import AssetPoolService from './AssetPoolService';
import ERC20Service from './ERC20Service';

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

        const assetPool = await AssetPoolService.getByAddress(membership.poolAddress);
        if (!assetPool) return null;

        const token = await ERC20Service.findByPool(assetPool);

        return {
            id: membership._id.toString(),
            token,
            poolAddress: membership.poolAddress,
            network: membership.network,
        };
    }

    static async addMembership(sub: string, assetPool: AssetPoolType) {
        const membership = await Membership.findOne({
            sub,
            network: assetPool.network,
            poolAddress: assetPool.address,
        });

        if (!membership) {
            const membership = new Membership({
                sub,
                network: assetPool.network,
                poolAddress: assetPool.address,
            });
            await membership.save();
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
