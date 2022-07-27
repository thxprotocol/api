import mongoose from 'mongoose';
import { TERC20 } from '@/types/TERC20';
import { getContractFromName } from '@/config/contracts';
import { ERC20Type } from '@/types/enums';

export type ERC20Document = mongoose.Document & TERC20;

const erc20Schema = new mongoose.Schema(
    {
        sub: String,
        type: Number,
        address: String,
        chainId: Number,
        name: String,
        symbol: String,
        transactions: [String],
        archived: Boolean,
    },
    { timestamps: true },
);

erc20Schema.virtual('contract').get(function () {
    if (!this.address) return;
    const contractName = this.type === ERC20Type.Unlimited ? 'UnlimitedSupplyToken' : 'LimitedSupplyToken';
    return getContractFromName(this.chainId, contractName, this.address);
});

export interface IERC20Updates {
    archived?: boolean;
}

export default mongoose.model<ERC20Document>('ERC20', erc20Schema);
