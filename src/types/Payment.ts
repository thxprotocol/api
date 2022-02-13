import { PaymentState } from '../enums/PaymentState';

export type PaymentType = {
    sub: string;
    amount: number;
    sender: string;
    receiver: string;
    order: string;
    state: PaymentState;
};
