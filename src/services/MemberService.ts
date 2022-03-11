import { tokenContract } from '@/util/network';
import { AssetPoolDocument, AssetPoolType } from '@/models/AssetPool';
import { assertEvent, parseLogs } from '@/util/events';
import { Artifacts } from '@/config/contracts/artifacts';
import { IMember, Member } from '@/models/Member';
import { fromWei } from 'web3-utils';
import { NotAMemberError, THXError } from '@/util/errors';
import TransactionService from './TransactionService';

export default class MemberService {
    static async getByAddress(assetPool: AssetPoolType, address: string) {
        const isMember = await this.isMember(assetPool, address);

        const isManager = await this.isManager(assetPool, address);

        const memberId = await TransactionService.call(
            assetPool.solution.methods.getMemberByAddress(address),
            assetPool.network,
        );
        const tokenAddress = await TransactionService.call(assetPool.solution.methods.getToken(), assetPool.network);
        const tokenInstance = tokenContract(assetPool.network, tokenAddress);
        const name = await TransactionService.call(tokenInstance.methods.name(), assetPool.network);
        const symbol = await TransactionService.call(tokenInstance.methods.symbol(), assetPool.network);
        const balance = Number(
            fromWei(await TransactionService.call(tokenInstance.methods.balanceOf(address), assetPool.network)),
        );

        return {
            id: memberId,
            address,
            isMember,
            isManager,
            token: {
                name,
                symbol,
                balance,
            },
        };
    }

    static findByAddress(address: string) {
        return Member.findOne({ address });
    }

    static async getByPoolAddress(assetPool: AssetPoolType) {
        const members = await Member.find({ poolAddress: assetPool.address });

        return members.map((member: IMember) => member.address);
    }

    static getMemberByAddress(assetPool: AssetPoolType, address: string): Promise<number> {
        return TransactionService.call(assetPool.solution.methods.getMemberByAddress(address), assetPool.network);
    }

    static async addMember(assetPool: AssetPoolType, address: string) {
        const { receipt } = await TransactionService.send(
            assetPool.address,
            assetPool.solution.methods.addMember(address),
            assetPool.network,
        );

        assertEvent('RoleGranted', parseLogs(Artifacts.IDefaultDiamond.abi, receipt.logs));

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
        return TransactionService.call(assetPool.solution.methods.isMember(address), assetPool.network);
    }

    static isManager(assetPool: AssetPoolType, address: string) {
        return TransactionService.call(assetPool.solution.methods.isManager(address), assetPool.network);
    }

    static async removeMember(assetPool: AssetPoolType, address: string) {
        const { receipt } = await TransactionService.send(
            assetPool.address,
            assetPool.solution.methods.removeMember(address),
            assetPool.network,
        );
        assertEvent('RoleRevoked', parseLogs(Artifacts.IDefaultDiamond.abi, receipt.logs));

        return await Member.deleteOne({ poolAddress: assetPool.address, address });
    }

    upgradeAddress() {
        return;
    }
}
