import { WithdrawalType } from '@/enums/WithdrawalType';
import { IWithdrawPoll } from '@/interfaces/IWithdrawPoll';

export type IWithdrawal = {
    type: WithdrawalType;
    poolAddress: string;
    beneficiary: string;
    amount: number;
    state: number;
    createdAt: Date;
    updatedAt: Date;
    fromBlock?: number;
    approved?: boolean;
    failReason?: string;
    rewardId?: number;
    withdrawalId?: number;
    poll?: IWithdrawPoll | null;
};
