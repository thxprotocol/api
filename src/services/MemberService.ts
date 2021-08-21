import { callFunction, sendTransaction } from '../util/network';
import { IAssetPool } from '../models/AssetPool';
import { findEvent, parseLogs } from '../util/events';
import { Artifacts } from '../util/artifacts';

const ERROR_IS_MEMBER_FAILED = 'Could not check if this address is a member';
const ERROR_ADD_MEMBER_FAILED = 'Could not find the RoleGranted event in the tx logs.';

export default class MemberService {
    static async addMember(assetPool: IAssetPool, address: string) {
        try {
            // 1 Check if in contract
            const isMember = await this.isMember(assetPool, address);

            if (isMember.error) {
                throw new Error(ERROR_IS_MEMBER_FAILED);
            }

            if (!isMember) {
                // 1.1 Add if not in contract
                const tx = await sendTransaction(
                    assetPool.address,
                    assetPool.solution.methods.addMember(address),
                    assetPool.network,
                );

                // 1.2 Check event
                const event = findEvent('RoleGranted', parseLogs(Artifacts.IDefaultDiamond.abi, tx.logs));

                if (!event) {
                    throw new Error(ERROR_ADD_MEMBER_FAILED);
                }
            }
        } catch (error) {
            return {
                error,
            };
        }
    }

    static async isMember(assetPool: IAssetPool, address: string) {
        try {
            return await callFunction(assetPool.solution.methods.isMember(address), assetPool.network);
        } catch (error) {
            return { error };
        }
    }

    removeMember() {
        return;
    }

    upgradeAddress() {
        return;
    }
}
