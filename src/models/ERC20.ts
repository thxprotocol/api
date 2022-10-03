import mongoose from 'mongoose';
import { TERC20 } from '@/types/TERC20';
import { getAbiForContractName } from '@/config/contracts';
import { ERC20Type } from '@/types/enums';
import { getProvider } from '@/util/network';

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
        logoImgUrl: String,
    },
    { timestamps: true },
);

erc20Schema.virtual('contractName').get(function () {
    return getContractName(this.type);
});

erc20Schema.virtual('contract').get(function () {
    if (!this.address) return;
    const { readProvider, defaultAccount } = getProvider(this.chainId);
    const abi = getAbiForContractName(getContractName(this.type));
    return new readProvider.eth.Contract(abi, this.address, { from: defaultAccount });
});

function getContractName(type: ERC20Type) {
    return type === ERC20Type.Unlimited ? 'UnlimitedSupplyToken' : 'LimitedSupplyToken';
}

export interface IERC20Updates {
    archived?: boolean;
}

export default mongoose.model<ERC20Document>('ERC20', erc20Schema);
