import { RPC, PRIVATE_KEY, GAS_STATION_ADDRESS } from '../util/secrets';
import Web3 from 'web3';
import * as BasePoll from '../artifacts/BasePoll.json';
import * as WithdrawPoll from '../artifacts/WithdrawPoll.json';
import * as RewardPoll from '../artifacts/RewardPoll.json';
import * as AssetPool from '../artifacts/AssetPool.json';
import * as Erc20 from '../artifacts/ERC20.json';
import * as GasStation from '../artifacts/GasStation.json';

export interface Artifact {
    abi: any;
    bytecode: any;
}

export const BASE_POLL: Artifact = BasePoll;
export const WITHDRAW_POLL: Artifact = WithdrawPoll;
export const REWARD_POLL: Artifact = RewardPoll;
export const ASSET_POOL: Artifact = AssetPool;
export const ERC20: Artifact = Erc20;
export const GAS_STATION: Artifact = GasStation;

export const web3 = new Web3(RPC);
const account = web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY);

web3.eth.accounts.wallet.add(account);

export const options = { from: account.address, gas: 6e6 };
export const gasStation = new web3.eth.Contract(GAS_STATION.abi, GAS_STATION_ADDRESS);
export const basePollContract = (address: string = null) => {
    return new web3.eth.Contract(BASE_POLL.abi, address);
};
export const rewardPollContract = (address: string = null) => {
    return new web3.eth.Contract(REWARD_POLL.abi, address);
};
export const withdrawPollContract = (address: string = null) => {
    return new web3.eth.Contract(WITHDRAW_POLL.abi, address);
};
export const assetPoolContract = (address: string = null) => {
    return new web3.eth.Contract(ASSET_POOL.abi, address);
};
export const tokenContract = (address: string = null) => {
    return new web3.eth.Contract(ERC20.abi, address);
};
export const toWei = (amount: number) => {
    return web3.utils.toWei(amount.toString(), 'ether');
};
