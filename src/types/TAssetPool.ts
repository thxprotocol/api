import { DiamondVariant } from '@thxnetwork/artifacts';
import { Contract } from 'web3-eth-contract';

export type TAssetPool = {
    address: string;
    contract: Contract;
    network: number;
    sub: string;
    clientId: string;
    blockNumber: number;
    transactionHash: string;
    lastTransactionAt?: number;
    bypassPolls: boolean;
    version?: string;
    variant?: DiamondVariant;
};
