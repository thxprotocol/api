import { DepositState } from '@/types/enums/DepositState';

export type TDeposit = {
    sub: string;
    amount: number;
    sender: string;
    receiver: string;
    item: string;
    state: DepositState;
    fromBlock: number;
};
