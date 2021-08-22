import { callFunction, sendTransaction } from '../util/network';
import { IAssetPool } from '../models/AssetPool';
import { findEvent, parseLogs } from '../util/events';
import { Artifacts } from '../util/artifacts';

export const ERROR_IS_MEMBER_FAILED = 'Could not check if this address is a member';
export const ERROR_ADD_MEMBER_FAILED = 'Could not add a membership for this address.';
export const ERROR_EVENT_LOG_SEARCH_FAILED = 'Could not find the RoleGranted event in the tx logs.';

export default class MemberService {
    static async get() {
        return;
    }

    static async addMember(assetPool: IAssetPool, address: string) {
        try {
            const { isMember, error } = await this.isMember(assetPool, address);

            if (error) {
                throw new Error(ERROR_IS_MEMBER_FAILED);
            }

            if (!isMember) {
                const tx = await sendTransaction(
                    assetPool.address,
                    assetPool.solution.methods.addMember(address),
                    assetPool.network,
                );
                const event = findEvent('RoleGranted', parseLogs(Artifacts.IDefaultDiamond.abi, tx.logs));

                if (!event) {
                    throw new Error(ERROR_EVENT_LOG_SEARCH_FAILED);
                }
            }

            return { memberId: true };
        } catch (error) {
            return {
                error: ERROR_ADD_MEMBER_FAILED,
            };
        }
    }

    static async isMember(assetPool: IAssetPool, address: string) {
        try {
            const result = await callFunction(assetPool.solution.methods.isMember(address), assetPool.network);

            return { isMember: result };
        } catch (error) {
            return { error: ERROR_IS_MEMBER_FAILED };
        }
    }

    removeMember() {
        return;
    }

    upgradeAddress() {
        return;
    }
}
