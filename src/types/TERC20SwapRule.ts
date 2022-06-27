import { ChainId } from './enums/ChainId';

export type TERC20SwapRule = {
    chainId: ChainId;
    poolAddress: string;
    tokenInId: string;
    tokenInAddress: string;
    tokenMultiplier: number;
};
