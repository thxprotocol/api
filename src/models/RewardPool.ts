import mongoose from 'mongoose';
import Web3 from 'web3';
import { LocalAddress, CryptoUtils, LoomProvider, Client } from 'loom-js';
import { PRIVATE_KEY, EXTDEV_CHAIN_ID, EXTDEV_SOCKET_URL, EXTDEV_QUERY_URL, REWARD_POOL_ABI } from '../util/secrets';

export const ownerAccount = () => {
    const privateKey = CryptoUtils.B64ToUint8Array(PRIVATE_KEY);
    const publicKey = CryptoUtils.publicKeyFromPrivateKey(privateKey);
    const address = LocalAddress.fromPublicKey(publicKey).toString();

    return { privateKey, publicKey, address };
};

export const rewardPoolContract = (address: string = null) => {
    const client: any = new Client(EXTDEV_CHAIN_ID, EXTDEV_SOCKET_URL, EXTDEV_QUERY_URL);
    const provider: any = new LoomProvider(client, ownerAccount().privateKey);
    const web3 = new Web3(provider);
    const abi = JSON.parse(REWARD_POOL_ABI);

    return new web3.eth.Contract(abi, address);
};

export type RewardPoolDocument = mongoose.Document & {
    address: string;
    title: string;
    uid: string;
    rewardRuleCount: number;
    rewardCount: number;
};

const rewardPoolSchema = new mongoose.Schema(
    {
        address: String,
        title: String,
        uid: String,
    },
    { timestamps: true },
);
export const RewardPool = mongoose.model<RewardPoolDocument>('RewardPool', rewardPoolSchema);
