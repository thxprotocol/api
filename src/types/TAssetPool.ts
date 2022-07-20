import { DiamondVariant } from '@thxnetwork/artifacts';
import { Contract } from 'web3-eth-contract';
import { ChainId } from './enums';

export type TAssetPool = {
    address: string;
    contract: Contract;
    chainId: ChainId;
    sub: string;
    clientId: string;
    transactions: string[];
    lastTransactionAt?: number;
    version?: string;
    variant?: DiamondVariant;
    archived?: boolean;
};
