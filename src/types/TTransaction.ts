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

export type TERC20DeployCallbackArgs = {
    erc20Id: string;
};

type ERC20DeployCallback = {
    type: 'Erc20DeployCallback';
    args: TERC20DeployCallbackArgs;
};

export type TAssetPoolDeployCallbackArgs = {
    assetPoolId: string;
    chainId: number;
    erc20Address: string;
    erc721Address: string;
};

type AssetPoolDeployCallback = {
    type: 'assetPoolDeployCallback';
    args: TAssetPoolDeployCallbackArgs;
};

export type TTopupCallbackArgs = {
    receiver: string;
    depositId: string;
};

type TopupCallback = {
    type: 'topupCallback';
    args: TTopupCallbackArgs;
};

export type TTransactionCallback = ERC20DeployCallback | AssetPoolDeployCallback | TopupCallback;
