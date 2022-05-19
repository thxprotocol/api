import mongoose from 'mongoose';
import { fromWei } from 'web3-utils';
import { getProvider } from '@/util/network';
import { TERC20 } from '@/types/TERC20';
import { getContractFromName } from '@/config/contracts';
import { ERC20Type } from '@/types/enums';

export type ERC20Document = mongoose.Document & TERC20;

const erc20Schema = new mongoose.Schema(
    {
        name: String,
        symbol: String,
        address: String,
        blockNumber: Number,
        type: Number,
        transactionHash: String,
        network: Number,
        sub: String,
    },
    { timestamps: true },
);

erc20Schema.virtual('contract').get(function () {
    const contractName = this.type === ERC20Type.Unlimited ? 'UnlimitedSupplyToken' : 'LimitedSupplyToken';
    return getContractFromName(this.network, contractName, this.address);
});

erc20Schema.methods.getResponse = async function () {
    return {
        ...this.toJSON(),
        totalSupply: await (async () => {
            const totalSupply = await this.contract.methods.totalSupply().call();
            return Number(fromWei(totalSupply, 'ether'));
        })(),
        decimals: await (async () => {
            const decimals = await this.contract.methods.decimals().call();
            return Number(decimals);
        })(),
        adminBalance: await (async () => {
            const { admin } = getProvider(this.network);
            const balance = await this.contract.methods.balanceOf(admin.address).call();
            return Number(fromWei(balance, 'ether'));
        })(),
    };
};

export default mongoose.model<ERC20Document>('ERC20', erc20Schema);
