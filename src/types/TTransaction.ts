import { ChainId, TransactionState, TransactionType } from './enums';

export type TTransaction = {
    type: TransactionType;
    state: TransactionState;
    from: string;
    to: string;
    nonce: number;
    gas: string;
    chainId: ChainId;
    transactionId: string;
    transactionHash?: string;
    call?: { fn: string; args: string };
    baseFee?: string;
    maxFeeForGas?: string;
    maxPriorityFeeForGas?: string;
    failReason?: string;
    callback: TTransactionCallback;
};

type ERC20DeployCallback = {
    type: 'Erc20DeployCallback';
    args: {
        erc20Id: string;
    };
};

export type TTransactionCallback = ERC20DeployCallback;
