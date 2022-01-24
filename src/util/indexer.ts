import { logger } from './logger';
import { callFunction, NetworkProvider, solutionContract } from './network';
import { Withdrawal, WithdrawalState } from '../models/Withdrawal';
import { fromWei } from 'web3-utils';

class EventIndexer {
    async onWithdrawPollVoted(npid: NetworkProvider, address: string, args: any) {
        try {
            const id = Number(args.id);
            const solution = solutionContract(npid, address);
            const withdrawal = await Withdrawal.findOne({ id, poolAddress: address });

            withdrawal.poll[args.vote ? 'yesCounter' : 'noCounter'] += 1;
            withdrawal.approved = await callFunction(solution.methods.withdrawPollApprovalState(id), npid);
            withdrawal.poll.totalVoted += 1;

            await withdrawal.save();
        } catch (e) {
            logger.error('EventIndexer.onWithdrawPollVoted() failed.', e);
        }
    }

    async onWithdrawPollRevokedVote(npid: NetworkProvider, address: string, args: any) {
        try {
            const id = Number(args.id);
            const withdrawal = await Withdrawal.findOne({ id, poolAddress: address });
            const solution = solutionContract(npid, address);
            const vote = await callFunction(solution.methods.votesByAddress(args.member), npid);

            withdrawal.poll[vote ? 'yesCounter' : 'noCounter'] -= 1;
            withdrawal.approved = await callFunction(solution.methods.withdrawPollApprovalState(id), npid);
            withdrawal.poll.totalVoted -= 1;

            await withdrawal.save();
        } catch (e) {
            logger.error('EventIndexer.onWithdrawPollRevokedVote() failed.', e);
        }
    }

    async onWithdrawPollCreated(npid: NetworkProvider, address: string, args: any) {
        try {
            const withdrawalId = args.id;
            const memberId = args.member;
            const existingWithdrawal = await Withdrawal.findOne({ withdrawalId, poolAddress: address });

            if (existingWithdrawal) {
                return;
            }

            const solution = solutionContract(npid, address);
            const amount = Number(fromWei(await callFunction(solution.methods.getAmount(withdrawalId), npid)));
            const beneficiary = await callFunction(solution.methods.getAddressByMember(memberId), npid);
            const approved = await callFunction(solution.methods.withdrawPollApprovalState(withdrawalId), npid);
            const startTime = Number(await callFunction(solution.methods.getStartTime(withdrawalId), npid));
            const endTime = Number(await callFunction(solution.methods.getEndTime(withdrawalId), npid));

            const withdrawal = new Withdrawal({
                withdrawalId,
                amount,
                poolAddress: solution.options.address,
                beneficiary,
                approved,
                state: WithdrawalState.Pending,
                poll: {
                    startTime,
                    endTime,
                    yesCounter: 0,
                    noCounter: 0,
                    totalVoted: 0,
                },
            });

            await withdrawal.save();
        } catch (e) {
            logger.error('EventIndexer.onWithdrawPollCreated() failed.', e);
        }
    }

    async onWithdrawn(npid: NetworkProvider, address: string, args: any) {
        try {
            const withdrawalId = args.id;
            const withdrawal = await Withdrawal.findOne({ withdrawalId, poolAddress: address });

            withdrawal.state = WithdrawalState.Withdrawn;

            await withdrawal.save();
        } catch (e) {
            logger.error('EventIndexer.onWithdrawn() failed.', e);
        }
    }

    async onWithdrawPollFinalized(npid: NetworkProvider, address: string, args: any) {
        try {
            const withdrawalId = args.id;
            const withdrawal = await Withdrawal.findOne({ withdrawalId, poolAddress: address });

            withdrawal.poll = null;

            await withdrawal.save();
        } catch (e) {
            logger.error('EventIndexer.onWithdrawPollFinalized() failed.', e);
        }
    }
}

export const eventIndexer = new EventIndexer();
