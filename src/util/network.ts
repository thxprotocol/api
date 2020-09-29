import { PRIVATE_KEY } from '../util/secrets';
import Web3 from 'web3';
import fs from 'fs';

export const BASE_POLL_ABI = fs.readFileSync('./src/contracts/BasePoll.abi', 'utf8');
export const WITHDRAW_POLL_ABI = fs.readFileSync('./src/contracts/WithdrawPoll.abi', 'utf8');
export const REWARD_POLL_ABI = fs.readFileSync('./src/contracts/RewardPoll.abi', 'utf8');
export const ASSET_POOL_ABI = fs.readFileSync('./src/contracts/AssetPool.abi', 'utf8');
export const ASSET_POOL_BIN = fs.readFileSync('./src/contracts/AssetPool.bin', 'utf8');
export const ERC20_ABI = fs.readFileSync('./src/contracts/ERC20.abi', 'utf8');

export const config = {
    child: {
        RPC: 'https://rpc-mumbai.matic.today',
        DERC20: '0xfe4F5145f6e09952a5ba9e956ED0C25e3Fa4c7F1',
        ERC20: '0xaC0A42a912398deBb9336e028724FF8B74169C80',
    },
};

const web3 = new Web3(config.child.RPC);
const account = web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY);

web3.eth.accounts.wallet.add(account);

export const options = { from: account.address, gas: 6e6 };
export const basePollContract = (address: string = null) => {
    return new web3.eth.Contract(JSON.parse(BASE_POLL_ABI), address);
};
export const rewardPollContract = (address: string = null) => {
    return new web3.eth.Contract(JSON.parse(REWARD_POLL_ABI), address);
};
export const withdrawPollContract = (address: string = null) => {
    return new web3.eth.Contract(JSON.parse(WITHDRAW_POLL_ABI), address);
};
export const assetPoolContract = (address: string = null) => {
    return new web3.eth.Contract(JSON.parse(ASSET_POOL_ABI), address);
};
export const tokenContract = (address: string = null) => {
    return new web3.eth.Contract(JSON.parse(ERC20_ABI), address);
};
export const toWei = (amount: number) => {
    return new Web3().utils.toWei(amount.toString(), 'ether');
};
