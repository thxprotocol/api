import mongoose from 'mongoose';
import { Contract } from 'web3-eth-contract';
import { fromWei } from 'web3-utils';
import { ERC20Type } from '@/types/enums';
import { tokenContract } from '@/util/network';

export interface ERC20 {
    name: string;
    symbol: string;
    address: string;
    totalSupply: number;
    blockNumber: number;
    type: ERC20Type;
    transactionHash: string;
    contract: Contract;
    network: number;
    sub: string;
    logoURI: string;
    // methods
    getResponse(): Promise<Omit<ERC20, 'getResponse'>>;
}

export type ERC20Document = mongoose.Document & ERC20;

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
    return tokenContract(this.network, this.address);
});

erc20Schema.methods.getResponse = async function () {
    return {
        ...this.toJSON(),
        totalSupply: await (async () => {
            const totalSupply = await this.contract.methods.totalSupply().call();
            return Number(fromWei(totalSupply, 'ether'));
        })(),
        logoURI: `https://avatars.dicebear.com/api/identicon/${this.address}.svg`,
    };
};

export default mongoose.model<ERC20Document>('ERC20', erc20Schema);
