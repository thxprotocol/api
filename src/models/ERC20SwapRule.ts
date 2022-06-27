import mongoose from 'mongoose';
import { TERC20SwapRule } from '@/types/TERC20SwapRule';

export type ERC20SwapRuleDocument = mongoose.Document & TERC20SwapRule;

const ERC20SwapRuleSchema = new mongoose.Schema(
    {
        chainId: Number,
        poolAddress: String,
        tokenInId: String,
        tokenInAddress: String,
        tokenMultiplier: Number,
    },
    { timestamps: true },
);

export const ERC20SwapRule = mongoose.model<ERC20SwapRuleDocument>(
    'ERC20SwapRule',
    ERC20SwapRuleSchema,
    'erc20swaprules',
);
