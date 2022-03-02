import { fromWei } from 'web3-utils';
import { solutionContract } from './network';
import { NetworkProvider } from '../types/enums';
import { Withdrawal } from '@/models/Withdrawal';
import { WithdrawalState } from '@/types/enums';
import { TransactionService } from '@/services/TransactionService';

class EventIndexer {
    async onWithdrawPollVoted(npid: NetworkProvider, address: string, args: any) {
        const withdrawalId = Number(args.id);
        const solution = solutionContract(npid, address);
        const withdrawal = await Withdrawal.findOne({ withdrawalId, poolAddress: address });

        withdrawal.poll[args.vote ? 'yesCounter' : 'noCounter'] += 1;
        withdrawal.approved = await TransactionService.call(
            solution.methods.withdrawPollApprovalState(withdrawalId),
            npid,
        );
        withdrawal.poll.totalVoted += 1;

        await withdrawal.save();
    }

    async onWithdrawPollRevokedVote(npid: NetworkProvider, address: string, args: any) {
        const withdrawalId = Number(args.id);
        const withdrawal = await Withdrawal.findOne({ withdrawalId, poolAddress: address });
        const solution = solutionContract(npid, address);
        const vote = await TransactionService.call(solution.methods.votesByAddress(args.member), npid);

        withdrawal.poll[vote ? 'yesCounter' : 'noCounter'] -= 1;
        withdrawal.approved = await TransactionService.call(
            solution.methods.withdrawPollApprovalState(withdrawalId),
            npid,
        );
        withdrawal.poll.totalVoted -= 1;

        await withdrawal.save();
    }

    async onWithdrawPollCreated(npid: NetworkProvider, address: string, args: any) {
        const withdrawalId = Number(args.id);
        const memberId = args.member;
        const existingWithdrawal = await Withdrawal.findOne({ withdrawalId, poolAddress: address });

        if (existingWithdrawal) {
            return;
        }

        const solution = solutionContract(npid, address);
        const amount = Number(fromWei(await TransactionService.call(solution.methods.getAmount(withdrawalId), npid)));
        const beneficiary = await TransactionService.call(solution.methods.getAddressByMember(memberId), npid);
        const approved = await TransactionService.call(solution.methods.withdrawPollApprovalState(withdrawalId), npid);
        const startTime = Number(await TransactionService.call(solution.methods.getStartTime(withdrawalId), npid));
        const endTime = Number(await TransactionService.call(solution.methods.getEndTime(withdrawalId), npid));

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
    }

    async onWithdrawn(npid: NetworkProvider, address: string, args: any) {
        const withdrawalId = Number(args.id);
        const withdrawal = await Withdrawal.findOne({ withdrawalId, poolAddress: address });

        withdrawal.state = WithdrawalState.Withdrawn;

        await withdrawal.save();
    }

    async onWithdrawPollFinalized(npid: NetworkProvider, address: string, args: any) {
        const withdrawalId = Number(args.id);
        const withdrawal = await Withdrawal.findOne({ withdrawalId, poolAddress: address });

        withdrawal.poll = null;

        await withdrawal.save();
    }
}

export const eventIndexer = new EventIndexer();
