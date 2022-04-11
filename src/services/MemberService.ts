import { AssetPoolType } from '@/models/AssetPool';
import { assertEvent, parseLogs } from '@/util/events';
import { IMember, Member } from '@/models/Member';
import TransactionService from './TransactionService';
import { getDiamondAbi } from '@/config/contracts';

export default class MemberService {
    static async getByAddress(assetPool: AssetPoolType, address: string) {
        const isMember = await this.isMember(assetPool, address);
        const isManager = await this.isManager(assetPool, address);
        const memberId = await TransactionService.call(
            assetPool.contract.methods.getMemberByAddress(address),
            assetPool.network,
        );

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

    static async countByPoolAddress(assetPool: AssetPoolType) {
        return (await Member.find({ poolAddress: assetPool.address })).length;
    }

    static async getByPoolAddress(assetPool: AssetPoolType) {
        const members = await Member.find({ poolAddress: assetPool.address });

        return members.map((member: IMember) => member.address);
    }

    static getMemberByAddress(assetPool: AssetPoolType, address: string): Promise<number> {
        return TransactionService.call(assetPool.contract.methods.getMemberByAddress(address), assetPool.network);
    }

    static async addMember(assetPool: AssetPoolType, address: string) {
        const { receipt } = await TransactionService.send(
            assetPool.address,
            assetPool.contract.methods.addMember(address),
            assetPool.network,
        );

        assertEvent('RoleGranted', parseLogs(assetPool.contract.options.jsonInterface, receipt.logs));

        const memberId = await this.getMemberByAddress(assetPool, address);

        return await Member.create({
            poolAddress: assetPool.address,
            memberId: Number(memberId),
            address,
        });
    }

    static async addExistingMember(assetPool: AssetPoolType, address: string) {
        const memberId = await MemberService.getMemberByAddress(assetPool, address);
        // Not using MemberService.addMember here since member is already added in the
        // solidity storage
        return await Member.create({
            poolAddress: assetPool.address,
            memberId: Number(memberId),
            address,
        });
    }

    static isMember(assetPool: AssetPoolType, address: string) {
        return TransactionService.call(assetPool.contract.methods.isMember(address), assetPool.network);
    }

    static isManager(assetPool: AssetPoolType, address: string) {
        return TransactionService.call(assetPool.contract.methods.isManager(address), assetPool.network);
    }

    static async removeMember(assetPool: AssetPoolType, address: string) {
        const { receipt } = await TransactionService.send(
            assetPool.address,
            assetPool.contract.methods.removeMember(address),
            assetPool.network,
        );
        assertEvent('RoleRevoked', parseLogs(getDiamondAbi(assetPool.network, 'defaultPool'), receipt.logs));

        return await Member.deleteOne({ poolAddress: assetPool.address, address });
    }

    upgradeAddress() {
        return;
    }
}
