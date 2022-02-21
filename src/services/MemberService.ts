import { callFunction, sendTransaction, tokenContract } from '@/util/network';
import { AssetPoolType } from '@/models/AssetPool';
import { assertEvent, parseLogs } from '@/util/events';
import { Artifacts } from '@/util/artifacts';
import { IMember, Member } from '@/models/Member';
import { fromWei } from 'web3-utils';
import { THXError } from '@/util/errors';

class NotAMemberError extends THXError {
    constructor(address: string, assetPool: string) {
        super(`${address} is not a member of assetPool ${assetPool}`);
    }
}
class AlreadyAMemberError extends THXError {
    constructor(address: string, assetPool: string) {
        super(`${address} is already a member of assetPool ${assetPool}`);
    }
}

export default class MemberService {
    static async getByAddress(assetPool: AssetPoolType, address: string) {
        const isMember = await this.isMember(assetPool, address);

        const isManager = await this.isManager(assetPool, address);

        const memberId = await callFunction(assetPool.solution.methods.getMemberByAddress(address), assetPool.network);
        const tokenAddress = await callFunction(assetPool.solution.methods.getToken(), assetPool.network);
        const tokenInstance = tokenContract(assetPool.network, tokenAddress);
        const name = await callFunction(tokenInstance.methods.name(), assetPool.network);
        const symbol = await callFunction(tokenInstance.methods.symbol(), assetPool.network);
        const balance = Number(
            fromWei(await callFunction(tokenInstance.methods.balanceOf(address), assetPool.network)),
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

    static async addMember(assetPool: AssetPoolType, address: string) {
        const isMember = await this.isMember(assetPool, address);

        if (isMember) {
            throw new AlreadyAMemberError(address, assetPool.address);
        }

        const tx = await sendTransaction(
            assetPool.address,
            assetPool.solution.methods.addMember(address),
            assetPool.network,
        );

        assertEvent('RoleGranted', parseLogs(Artifacts.IDefaultDiamond.abi, tx.logs));

        const memberId = await callFunction(assetPool.solution.methods.getMemberByAddress(address), assetPool.network);

        const members = await Member.find({ poolAddress: assetPool.address, address });

        if (!members.length) {
            const member = new Member({
                poolAddress: assetPool.address,
                memberId: Number(memberId),
                address,
            });

            await member.save();
        }

        return memberId;
    }

    static async isMember(assetPool: AssetPoolType, address: string) {
        return callFunction(assetPool.solution.methods.isMember(address), assetPool.network);
    }

    static isManager(assetPool: AssetPoolType, address: string) {
        return callFunction(assetPool.solution.methods.isManager(address), assetPool.network);
    }

    static async removeMember(assetPool: AssetPoolType, address: string) {
        const isMember = await this.isMember(assetPool, address);

        if (!isMember) {
            throw new NotAMemberError(address, assetPool.address);
        }

        const tx = await sendTransaction(
            assetPool.address,
            assetPool.solution.methods.removeMember(address),
            assetPool.network,
        );
        assertEvent('RoleRevoked', parseLogs(Artifacts.IDefaultDiamond.abi, tx.logs));

        const member = await Member.findOne({ poolAddress: assetPool.address, address });

        await member.remove();
    }

    upgradeAddress() {
        return;
    }
}
