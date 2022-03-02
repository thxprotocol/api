import { WithdrawalType } from '@/types/enums';
import { IWithdrawPoll } from '@/types/interfaces/IWithdrawPoll';

export type TWithdrawal = {
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
