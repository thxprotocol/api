import { DepositState } from '@/types/enums/DepositState';

export type TDeposit = {
    id: string;
    sub: string;
    amount: number;
    sender: string;
    receiver: string;
    state: DepositState;
    transactions: string[];
    item?: string;
    failReason?: string;
    createdAt: Date;
    updatedAt?: Date;
};
