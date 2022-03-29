import BN from 'bn.js';
import mongoose from 'mongoose';
import { Contract } from 'web3-eth-contract';
import { fromWei } from 'web3-utils';

import { getContract } from '@/config/contracts';
import { ERC20Type } from '@/types/enums';
import { getContractFromAbi, tokenContract } from '@/util/network';
import { ContractName } from '@thxnetwork/artifacts';

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

    // methods
    getTotalSupply(): Promise<number>;
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
    // Later we can add the version of the pool as well.
    return tokenContract(this.network, this.address);
});

erc20Schema.methods.getTotalSupply = async function () {
    const contract: Contract = this.contract;
    const totalSupply = await contract.methods.totalSupply().call();
    console.log('What the heck of this', totalSupply);
    return fromWei(totalSupply, 'ether');
};

export default mongoose.model<ERC20Document>('ERC20', erc20Schema);
