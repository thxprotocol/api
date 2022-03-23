import { getContract } from '@/config/contracts';
import { getContractFromAbi } from '@/util/network';
import mongoose from 'mongoose';
import { Contract } from 'web3-eth-contract';

export interface Token {
    name: string;
    symbol: string;
    totalSuplly: string;
    blockNumber: number;
    transactionHash: string;
    contract: Contract;
    network: number;
    sub: string;
}

export type TokenDocument = mongoose.Document & Token;

const tokenSchema = new mongoose.Schema(
    {
        name: String,
        symbol: String,
        totalSuplly: String,
        blockNumber: Number,
        transactionHash: String,
        network: Number,
        sub: String,
    },
    { timestamps: true },
);

tokenSchema.virtual('contract').get(function () {
    // Later we can add the version of the pool as well.
    return getContractFromAbi(
        this.network,
        getContract(this.network, 'TokenFactory').options.jsonInterface,
        this.address,
    );
});

export default mongoose.model<TokenDocument>('Token', tokenSchema);
