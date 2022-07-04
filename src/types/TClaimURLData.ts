import { IRewardCondition } from '@/models/Reward';
import { ChainId } from './enums';
import { TClaim } from './TClaim';

export type TClaimURLData = TClaim & {
    chainId: ChainId;
    poolAddress: string;
    tokenSymbol: string;
    withdrawAmount: number;
    withdrawCondition?: IRewardCondition;
    clientId: string;
};
