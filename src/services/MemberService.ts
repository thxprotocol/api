import { callFunction, sendTransaction, tokenContract } from '../util/network';
import { IAssetPool } from '../models/AssetPool';
import { findEvent, parseLogs } from '../util/events';
import { Artifacts } from '../util/artifacts';
import { IMember, Member } from '../models/Member';
import { formatEther } from 'ethers/lib/utils';

export const ERROR_IS_MEMBER_FAILED = 'Could not check if this address is a member';
export const ERROR_IS_MANAGER_FAILED = 'Could not check if this address is a manager';
export const ERROR_ADD_MEMBER_FAILED = 'Could not add a member role for this address.';
export const ERROR_ADD_MANAGER_FAILED = 'Could not add a manager role for this address.';
export const ERROR_EVENT_ROLE_GRANTED_FAILED = 'Could not find the RoleGranted event in the tx logs.';
export const ERROR_EVENT_ROLE_REVOKED_FAILED = 'Could not find the RoleRevoked event in the tx logs.';
export const ERROR_IS_MEMBER_ALREADY = 'This address is already a member.';
export const ERROR_IS_NOT_MEMBER = 'This address is not a member.';

export default class MemberService {
    static async getByAddress(assetPool: IAssetPool, address: string) {
        try {
            const { isMember, error } = await this.isMember(assetPool, address);

            if (error) {
                throw new Error(error);
            } else {
                const { isManager, error } = await this.isManager(assetPool, address);

                if (error) {
                    throw new Error(error);
                } else {
                    const tokenAddress = await callFunction(assetPool.solution.methods.getToken(), assetPool.network);
                    const tokenInstance = tokenContract(assetPool.network, tokenAddress);
                    const name = await callFunction(tokenInstance.methods.name(), assetPool.network);
                    const symbol = await callFunction(tokenInstance.methods.symbol(), assetPool.network);
                    const balance = Number(
                        formatEther(await callFunction(tokenInstance.methods.balanceOf(address), assetPool.network)),
                    );

                    return {
                        member: {
                            address,
                            isMember,
                            isManager,
                            token: {
                                name,
                                symbol,
                                balance,
                            },
                        },
                    };
                }
            }
        } catch (error) {
            return { error };
        }
    }

    static async getByPoolAddress(assetPool: IAssetPool) {
        try {
            const members = await Member.find({ poolAddress: assetPool.address });

            return { members: members.map((member: IMember) => member.address) };
        } catch (error) {
            return { error };
        }
    }

    static async addMember(assetPool: IAssetPool, address: string) {
        try {
            const { isMember, error } = await this.isMember(assetPool, address);

            if (error) {
                throw new Error(ERROR_IS_MEMBER_FAILED);
            }

            if (isMember) {
                throw new Error(ERROR_IS_MEMBER_ALREADY);
            }

            const tx = await sendTransaction(
                assetPool.address,
                assetPool.solution.methods.addMember(address),
                assetPool.network,
            );
            const event = findEvent('RoleGranted', parseLogs(Artifacts.IDefaultDiamond.abi, tx.logs));

            if (!event) {
                throw new Error(ERROR_EVENT_ROLE_GRANTED_FAILED);
            }

            const memberId = await callFunction(
                assetPool.solution.methods.getMemberByAddress(address),
                assetPool.network,
            );

            const members = await Member.find({ poolAddress: assetPool.address, address });

            if (!members.length) {
                const member = new Member({
                    poolAddress: assetPool.address,
                    memberId: Number(memberId),
                    address,
                });

                await member.save();
            }

            return { memberId };
        } catch (error) {
            return {
                error,
            };
        }
    }

    static async isMember(assetPool: IAssetPool, address: string) {
        try {
            const isMember = await callFunction(assetPool.solution.methods.isMember(address), assetPool.network);
            return { isMember };
        } catch (error) {
            return { error: ERROR_IS_MEMBER_FAILED };
        }
    }

    static async isManager(assetPool: IAssetPool, address: string) {
        try {
            const isManager = await await callFunction(
                assetPool.solution.methods.isManager(address),
                assetPool.network,
            );
            return { isManager };
        } catch (error) {
            return { error: ERROR_IS_MANAGER_FAILED };
        }
    }

    static async removeMember(assetPool: IAssetPool, address: string) {
        try {
            const { isMember, error } = await this.isMember(assetPool, address);

            if (error) {
                throw new Error(ERROR_IS_MEMBER_FAILED);
            } else {
                if (!isMember) {
                    throw new Error(ERROR_IS_NOT_MEMBER);
                }

                const tx = await sendTransaction(
                    assetPool.address,
                    assetPool.solution.methods.removeMember(address),
                    assetPool.network,
                );
                const event = findEvent('RoleRevoked', parseLogs(Artifacts.IDefaultDiamond.abi, tx.logs));

                if (!event) {
                    throw new Error(ERROR_EVENT_ROLE_REVOKED_FAILED);
                }

                const member = await Member.findOne({ poolAddress: assetPool.address, address });

                await member.remove();

                return { result: true };
            }
        } catch (error) {
            return {
                error: ERROR_ADD_MEMBER_FAILED,
            };
        }
    }

    upgradeAddress() {
        return;
    }
}
