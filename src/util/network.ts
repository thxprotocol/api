import Web3 from 'web3';
import { LocalAddress, CryptoUtils, LoomProvider, Client } from 'loom-js';
import {
    ERC20_ABI,
    PRIVATE_KEY,
    EXTDEV_CHAIN_ID,
    EXTDEV_SOCKET_URL,
    EXTDEV_QUERY_URL,
    REWARD_POOL_ABI,
    REWARD_ABI,
} from '../util/secrets';
import logger from './logger';

export const toWei = (amount: number) => {
    return new Web3().utils.toWei(amount.toString(), 'ether');
};

export const ownerAccount = () => {
    try {
        const privateKey = CryptoUtils.B64ToUint8Array(PRIVATE_KEY);
        const publicKey = CryptoUtils.publicKeyFromPrivateKey(privateKey);
        const address = LocalAddress.fromPublicKey(publicKey).toString();

        return { privateKey, publicKey, address };
    } catch (err) {
        logger.error(err);
    }
};

export const rewardContract = (address: string = null) => {
    try {
        const client: any = new Client(EXTDEV_CHAIN_ID, EXTDEV_SOCKET_URL, EXTDEV_QUERY_URL);
        const provider: any = new LoomProvider(client, ownerAccount().privateKey);
        const web3 = new Web3(provider);
        const abi = JSON.parse(REWARD_ABI);

        return new web3.eth.Contract(abi, address);
    } catch (err) {
        logger.error(err);
    }
};

export const rewardPoolContract = (address: string = null) => {
    try {
        const client: any = new Client(EXTDEV_CHAIN_ID, EXTDEV_SOCKET_URL, EXTDEV_QUERY_URL);
        const provider: any = new LoomProvider(client, ownerAccount().privateKey);
        const web3 = new Web3(provider);
        const abi = JSON.parse(REWARD_POOL_ABI);

        return new web3.eth.Contract(abi, address);
    } catch (err) {
        logger.error(err);
    }
};

export const tokenContract = (address: string = null) => {
    try {
        const client: any = new Client(EXTDEV_CHAIN_ID, EXTDEV_SOCKET_URL, EXTDEV_QUERY_URL);
        const provider: any = new LoomProvider(client, ownerAccount().privateKey);
        const web3 = new Web3(provider);
        const abi = JSON.parse(ERC20_ABI);

        return new web3.eth.Contract(abi, address);
    } catch (err) {
        logger.error(err);
    }
};
