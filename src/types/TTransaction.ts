import { NetworkProvider, TransactionState, TransactionType } from './enums';

export type TTransaction = {
    type: TransactionType;
    state: TransactionState;
    from: string;
    to: string;
    nonce: number;
    gas: string;
    network: NetworkProvider;
    transactionHash: string;
    relayTransactionHash?: string;
    calldata?: { call: string; nonce: number; sig: string };
    baseFee?: string;
    maxFeeForGas?: string;
    maxPriorityFeeForGas?: string;
};
