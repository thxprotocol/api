import { ethers } from 'ethers';
import { RPC, PRIVATE_KEY, GAS_STATION_ADDRESS } from '../util/secrets';
import * as BasePoll from '../artifacts/BasePoll.json';
import * as WithdrawPoll from '../artifacts/WithdrawPoll.json';
import * as RewardPoll from '../artifacts/RewardPoll.json';
import * as AssetPool from '../artifacts/AssetPool.json';
import * as Erc20 from '../artifacts/ERC20.json';
import * as GasStation from '../artifacts/GasStation.json';

function hex2a(hex: any) {
    var str = '';
    for (var i = 0; i < hex.length; i += 2) {
        var v = parseInt(hex.substr(i, 2), 16);
        if (v == 8) continue; // http://www.fileformat.info/info/unicode/char/0008/index.htm
        if (v == 15) continue;
        if (v == 16) continue; // http://www.fileformat.info/info/unicode/char/0010/index.htm
        if (v == 14) continue; // https://www.fileformat.info/info/unicode/char/000e/index.htm
        if (v) str += String.fromCharCode(v);
    }
    return str.trim();
}

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

export const provider = new ethers.providers.JsonRpcProvider(RPC);
export const admin = new ethers.Wallet(PRIVATE_KEY, provider);
export const gasStation = new ethers.Contract(GAS_STATION_ADDRESS, GAS_STATION.abi, admin);
export const assetPoolFactory = new ethers.ContractFactory(ASSET_POOL.abi, ASSET_POOL.bytecode, admin);
export const basePollContract = (address: string = null) => {
    return new ethers.Contract(address, BASE_POLL.abi, admin);
};
export const rewardPollContract = (address: string = null) => {
    return new ethers.Contract(address, REWARD_POLL.abi, admin);
};
export const withdrawPollContract = (address: string = null) => {
    return new ethers.Contract(address, WITHDRAW_POLL.abi, admin);
};
export const assetPoolContract = (address: string = null) => {
    return new ethers.Contract(address, ASSET_POOL.abi, admin);
};
export const tokenContract = (address: string = null) => {
    return new ethers.Contract(address, ERC20.abi, admin);
};
export function parseLogs(abi: any, logs: any = []) {
    return logs.map((log: any) => {
        const contractInterface = new ethers.utils.Interface(abi);
        return contractInterface.parseLog(log);
    });
}
export async function parseResultLog(abi: any, logs: any) {
    const gasStationInterface = new ethers.utils.Interface(GAS_STATION.abi);
    const event = gasStationInterface.parseLog(logs[logs.length - 1]);

    if (event.args.success) {
        const res = [];
        for (const log of logs) {
            let event;
            try {
                const contractInterface = new ethers.utils.Interface(abi);
                event = contractInterface.parseLog(log);
            } catch (err) {
                continue;
            }
            res.push(event);
        }
        return {
            logs: res,
        };
    } else {
        // remove initial string that indicates this is an error
        // then parse it to hex --> ascii
        const error = hex2a(event.args.data.substr(10));
        return {
            error: error,
        };
    }
}
