import { WithdrawalState, WithdrawalType } from '@/types/enums';

export type TWithdrawal = {
    id: string;
    type: WithdrawalType;
    state: WithdrawalState;
    poolAddress: string;
    sub: string;
    beneficiary: string; // TODO Should be deprecated after sub was added
    transactions: string[];
    amount: number;
    rewardId?: number;
    withdrawalId?: number;
    failReason?: string;
    createdAt: Date;
    updatedAt?: Date;
};
