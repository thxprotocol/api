import { NetworkProvider, TransactionState, TransactionType } from './enums';

export type TTransaction = {
    type: TransactionType;
    state: TransactionState;
    from: string;
    to: string;
    nonce: number;
    gas: string;
    transactionHash: string;
    relayTransactionHash: string;
    baseFee?: string;
    maxFeeForGas?: string;
    maxPriorityFeeForGas?: string;
    network: NetworkProvider;
};
