import { Membership } from '../models/Membership';
import AssetPoolService from './AssetPoolService';

const ERROR_MEMBERSHIP_GET_FAILED = 'Could not get the membership information from the database';
const ERROR_MEMBERSHIP_DELETE_FAILED = 'Could not delete the membership information from the database';

export default class MembershipService {
    static async get(sub: string) {
        try {
            const memberships = await Membership.find({ sub });
            const result = [];

            for (const membership of memberships) {
                const { assetPool } = await AssetPoolService.getByAddress(membership.poolAddress);
                const { token } = await AssetPoolService.getPoolToken(assetPool);

                result.push({
                    id: membership._id,
                    token,
                    poolAddress: membership.poolAddress,
                    network: membership.network,
                });
            }

            return { memberships: result };
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

    static async remove(id: string) {
        try {
            const membership = await Membership.findById(id);

            await membership.remove();
            return { result: true };
        } catch (error) {
            return { error: ERROR_MEMBERSHIP_DELETE_FAILED };
        }
    }
}
