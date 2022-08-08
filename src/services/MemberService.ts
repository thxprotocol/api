import { IMember, Member } from '@/models/Member';
import { paginatedResults } from '@/util/pagination';
import { AssetPoolDocument } from '@/models/AssetPool';

export default class MemberService {
    static async getByAddress(assetPool: AssetPoolDocument, address: string) {
        const isMember = await this.isMember(assetPool, address);
        const isManager = await this.isManager(assetPool, address);
        const memberId = await assetPool.contract.methods.getMemberByAddress(address).call();

        return {
            id: memberId,
            address,
            isMember,
            isManager,
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
        return await Member.create({
            poolAddress: assetPool.address,
            address,
        });
    }

    static async addExistingMember(assetPool: AssetPoolDocument, address: string) {
        return await Member.create({
            poolAddress: assetPool.address,
            address,
        });
    }

    static isMember(assetPool: AssetPoolDocument, address: string) {
        return assetPool.contract.methods.isMember(address).call();
    }

    static isManager(assetPool: AssetPoolDocument, address: string) {
        return assetPool.contract.methods.isManager(address).call();
    }

    static async findByQuery(query: { poolId: string }, page = 1, limit = 10) {
        return paginatedResults(Member, page, limit, query);
    }

    static async removeMember(assetPool: AssetPoolDocument, address: string) {
        return await Member.deleteOne({ poolAddress: assetPool.address, address });
    }

    upgradeAddress() {
        return;
    }
}
