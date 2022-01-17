import { IAssetPool } from '../models/AssetPool';
import { NetworkProvider } from '../util/network';
import { Membership } from '../models/Membership';
import AssetPoolService from './AssetPoolService';

const ERROR_MEMBERSHIP_GET_FAILED = 'Could not get the membership information from the database';
const ERROR_MEMBERSHIP_DELETE_FAILED = 'Could not delete the membership information from the database';

export default class MembershipService {
    static async get(sub: string) {
        try {
            const memberships = await Membership.find({ sub });
            return { memberships: memberships.map((m) => m._id.toString()) };
        } catch (error) {
            return { error: ERROR_MEMBERSHIP_GET_FAILED };
        }
    }

    static async getById(id: string) {
        try {
            const membership = await Membership.findById(id);
            const { assetPool } = await AssetPoolService.getByAddress(membership.poolAddress);
            const { token } = await AssetPoolService.getPoolToken(assetPool);

            return {
                membership: {
                    id: membership._id,
                    token,
                    poolAddress: membership.poolAddress,
                    network: membership.network,
                },
            };
        } catch (error) {
            return { error: ERROR_MEMBERSHIP_GET_FAILED };
        }
    }

    static async addMembership(sub: string, assetPool: IAssetPool) {
        try {
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

            return { result: true };
        } catch (error) {
            return { error };
        }
    }

    static async removeMembership(sub: string, assetPool: IAssetPool) {
        try {
            const membership = await Membership.findOne({
                sub,
                network: assetPool.network,
                poolAddress: assetPool.address,
            });

            await membership.remove();

            return { result: true };
        } catch (error) {
            return { error };
        }
    }

    static async remove(id: string) {
        try {
            const membership = await Membership.findById(id);

            await membership.remove();
            return { result: true };
        } catch (error) {
            return { error: ERROR_MEMBERSHIP_DELETE_FAILED };
        }
    }

    static async countByNetwork(network: NetworkProvider) {
        try {
            return await Membership.countDocuments({ network });
        } catch (error) {
            return { error };
        }
    }
}
