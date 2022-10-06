import { IMember, Member } from '@/models/Member';
import { paginatedResults } from '@/util/pagination';
import { AssetPoolDocument } from '@/models/AssetPool';

export default class MemberService {
    static async getByAddress(assetPool: AssetPoolDocument, address: string) {
        const isMember = await this.isMember(assetPool, address);
        return {
            address,
            isMember,
        };
    }

    static findByAddress(address: string) {
        return Member.findOne({ address });
    }

    static async countByPool(assetPool: AssetPoolDocument) {
        return (await Member.find({ poolId: assetPool._id })).length;
    }

    static async getByPool(assetPool: AssetPoolDocument) {
        const members = await Member.find({ poolId: assetPool._id });
        return members.map((member: IMember) => member.address);
    }

    static async addMember(assetPool: AssetPoolDocument, address: string) {
        return Member.create({
            poolId: String(assetPool._id),
            address,
        });
    }

    static isMember(pool: AssetPoolDocument, address: string) {
        return Member.exists({ poolId: String(pool._id), address });
    }

    static async findByQuery(query: { poolId: string }, page = 1, limit = 10) {
        return paginatedResults(Member, page, limit, query);
    }

    static async removeMember(assetPool: AssetPoolDocument, address: string) {
        return Member.deleteOne({ poolAddress: assetPool.address, address });
    }

    upgradeAddress() {
        return;
    }
}
