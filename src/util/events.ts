import { ethers } from 'ethers';
import { logger } from './logger';
import IDefaultDiamondArtifact from '../artifacts/contracts/contracts/IDefaultDiamond.sol/IDefaultDiamond.json';
import Web3 from 'web3';

export function parseArgs(ev: any) {
    const args: any = {};
    for (const key of Object.keys(ev.args)) {
        if (isNaN(Number(key))) {
            args[key] = ev.args[key];
        }
    }
    return args;
}

export const events = async (tx: any) => {
    tx = await tx;
    tx = await tx.wait();
    return tx.events;
};

export function parseLog(abi: any, log: any) {
    const contractInterface = new ethers.utils.Interface(abi);
    try {
        return contractInterface.parseLog(log);
    } catch (e) {
        logger.error(e.toString());
        return;
    }
}

export function hex2a(hex: any) {
    let str = '';
    for (let i = 0; i < hex.length; i += 2) {
        const v = parseInt(hex.substr(i, 2), 16);
        if (v == 8) continue; // http://www.fileformat.info/info/unicode/char/0008/index.htm
        if (v == 15) continue;
        if (v == 16) continue; // http://www.fileformat.info/info/unicode/char/0010/index.htm
        if (v == 14) continue; // https://www.fileformat.info/info/unicode/char/000e/index.htm
        if (v) str += String.fromCharCode(v);
    }
    return str.trim();
}

export function parseLogs(abi: any, logs: any = []) {
    const contractInterface = new ethers.utils.Interface(abi);
    return logs.map((log: any) => {
        try {
            return contractInterface.parseLog(log);
        } catch (e) {
            return;
        }
    });
}

export async function parseResultLog(logs: any) {
    const gasStationInterface = new ethers.utils.Interface(IDefaultDiamondArtifact.abi);
    const event = gasStationInterface.parseLog(logs[logs.length - 1]);

    if (event.args.success) {
        const res = [];
        for (const log of logs) {
            let event;
            try {
                const contractInterface = new ethers.utils.Interface(IDefaultDiamondArtifact.abi);
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
