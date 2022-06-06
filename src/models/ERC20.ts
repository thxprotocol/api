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
        network: Number,
        name: String,
        symbol: String,
    },
    { timestamps: true },
);

erc20Schema.virtual('contract').get(function () {
    if (!this.address) return;
    const contractName = this.type === ERC20Type.Unlimited ? 'UnlimitedSupplyToken' : 'LimitedSupplyToken';
    return getContractFromName(this.network, contractName, this.address);
});

export default mongoose.model<ERC20Document>('ERC20', erc20Schema);
