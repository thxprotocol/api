import { TAssetPool } from '@/types/TAssetPool';
import { assertEvent, parseLogs } from '@/util/events';
import { IMember, Member } from '@/models/Member';
import TransactionService from './TransactionService';
import { getDiamondAbi } from '@/config/contracts';
import { paginatedResults } from '@/util/pagination';

export default class MemberService {
    static async getByAddress(assetPool: TAssetPool, address: string) {
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

    static async countByPoolAddress(assetPool: TAssetPool) {
        return (await Member.find({ poolAddress: assetPool.address })).length;
    }

    static async getByPoolAddress(assetPool: TAssetPool) {
        const members = await Member.find({ poolAddress: assetPool.address });

        return members.map((member: IMember) => member.address);
    }

    static getMemberByAddress(assetPool: TAssetPool, address: string): Promise<number> {
        return assetPool.contract.methods.getMemberByAddress(address).call();
    }

    static async addMember(assetPool: TAssetPool, address: string) {
        const { receipt } = await TransactionService.send(
            assetPool.address,
            assetPool.contract.methods.addMember(address),
            assetPool.chainId,
        );

        assertEvent('RoleGranted', parseLogs(assetPool.contract.options.jsonInterface, receipt.logs));

        const memberId = await this.getMemberByAddress(assetPool, address);

        return await Member.create({
            poolAddress: assetPool.address,
            memberId: Number(memberId),
            address,
        });
    }

    static async addExistingMember(assetPool: TAssetPool, address: string) {
        const memberId = await MemberService.getMemberByAddress(assetPool, address);
        // Not using MemberService.addMember here since member is already added in the
        // solidity storage
        return await Member.create({
            poolAddress: assetPool.address,
            memberId: Number(memberId),
            address,
        });
    }

    static isMember(assetPool: TAssetPool, address: string) {
        return assetPool.contract.methods.isMember(address).call();
    }

    static isManager(assetPool: TAssetPool, address: string) {
        return assetPool.contract.methods.isManager(address).call();
    }

    static async findByQuery(query: { poolAddress: string }, page = 1, limit = 10) {
        return paginatedResults(Member, page, limit, query);
    }

    static async removeMember(assetPool: TAssetPool, address: string) {
        const { receipt } = await TransactionService.send(
            assetPool.address,
            assetPool.contract.methods.removeMember(address),
            assetPool.chainId,
        );
        assertEvent('RoleRevoked', parseLogs(getDiamondAbi(assetPool.chainId, 'defaultPool'), receipt.logs));

        return await Member.deleteOne({ poolAddress: assetPool.address, address });
    }

    upgradeAddress() {
        return;
    }
}
