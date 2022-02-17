import mongoose from 'mongoose';
import { solutionContract } from '@/util/network';
import { Contract } from 'web3-eth-contract';

export type AssetPoolType = {
    address: string;
    solution: Contract;
    network: number;
    sub: string;
    clientId: string;
    blockNumber: number;
    transactionHash: string;
    bypassPolls: boolean;
    rewardPollDuration: number;
    proposeWithdrawPollDuration: number;
};

export type AssetPoolDocument = mongoose.Document & AssetPoolType;

export interface IAssetPoolUpdates {
    proposeWithdrawPollDuration?: number;
    rewardPollDuration?: number;
    bypassPolls?: boolean;
}

const assetPoolSchema = new mongoose.Schema(
    {
        address: String,
        network: Number,
        sub: String,
        clientId: String,
        blockNumber: Number,
        transactionHash: String,
        bypassPolls: Boolean,
    },
    { timestamps: true },
);

assetPoolSchema.virtual('solution').get(function () {
    return solutionContract(this.network, this.address);
});

export const AssetPool = mongoose.model<AssetPoolDocument>('AssetPool', assetPoolSchema);
