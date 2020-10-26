import { RPC, PRIVATE_KEY } from '../util/secrets';
import Web3 from 'web3';
import fs from 'fs';

export const BASE_POLL_ABI = fs.readFileSync('./src/contracts/BasePoll.abi', 'utf8');
export const WITHDRAW_POLL_ABI = fs.readFileSync('./src/contracts/WithdrawPoll.abi', 'utf8');
export const REWARD_POLL_ABI = fs.readFileSync('./src/contracts/RewardPoll.abi', 'utf8');
export const ASSET_POOL_ABI = fs.readFileSync('./src/contracts/AssetPool.abi', 'utf8');
export const ASSET_POOL_BIN = fs.readFileSync('./src/contracts/AssetPool.bin', 'utf8');
export const ERC20_BIN = fs.readFileSync('./src/contracts/ERC20.bin', 'utf8');
export const ERC20_ABI = fs.readFileSync('./src/contracts/ERC20.abi', 'utf8');
export const TEST_TOKEN_BIN = fs.readFileSync('./src/contracts/TestToken.bin', 'utf8');
export const TEST_TOKEN_ABI = fs.readFileSync('./src/contracts/TestToken.abi', 'utf8');

export const web3 = new Web3(RPC);
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
    return web3.utils.toWei(amount.toString(), 'ether');
};
export const deployTestTokenContract = async () => {
    const contract = new web3.eth.Contract(JSON.parse(TEST_TOKEN_ABI));
    return await contract.deploy({ data: TEST_TOKEN_BIN, arguments: [] }).send(options);
};
export const testTokenContract = (address: string = null) => {
    return new web3.eth.Contract(JSON.parse(TEST_TOKEN_ABI), address);
};
