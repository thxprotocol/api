import dotenv from 'dotenv';
import IDefaultDiamondArtifact from '../src/artifacts/contracts/contracts/IDefaultDiamond.sol/IDefaultDiamond.json';
import WithdrawPollArtifact from '../src/artifacts/contracts/contracts/05-Withdraw/WithdrawPoll.sol/WithdrawPoll.json';

import { Wallet, Contract, providers, BigNumber } from 'ethers';
import { arrayify, formatEther, Interface } from 'ethers/lib/utils';
import Web3 from 'web3';

dotenv.config({ path: '.env.production' });

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const RPC = process.env.TESTNET_RPC_WSS;
const WALLET_PRIVATE_KEY = '0x35fcbe96dc3814124068d3ea7ac56e0d32763223bc9f015d5be65cff10102eb1';
const ASSET_POOL = '0x38728E872553Cd8189A6E5cB916B15Ad78Ae0a42';

function hex2a(hex: any) {
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

function parseLogs(abi: any, logs: any = []) {
    return logs.map((log: any) => {
        const contractInterface = new Interface(abi);
        try {
            return contractInterface.parseLog(log);
        } catch (e) {
            return;
        }
    });
}

async function parseResultLog(logs: any) {
    console.log(logs);
    const gasStationInterface = new Interface(IDefaultDiamondArtifact.abi);
    console.log(gasStationInterface);
    console.log(logs[logs.length - 1]);
    const event = gasStationInterface.parseLog(logs[logs.length - 1]);
    console.log(event);

    if (event.args.success) {
        const res = [];
        for (const log of logs) {
            let event;
            try {
                const contractInterface = new Interface(IDefaultDiamondArtifact.abi);
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

async function signMethod(solution: Contract, name: string, args: any[], account: Wallet) {
    let nonce = await solution.getLatestNonce(await account.getAddress());
    nonce = parseInt(nonce) + 1;
    const call = solution.interface.encodeFunctionData(name, args);
    const hash = Web3.utils.soliditySha3(call, nonce);
    const sig = await account.signMessage(arrayify(hash));
    return {
        call,
        nonce,
        sig,
    };
}

async function main() {
    const provider = new providers.WebSocketProvider(RPC);
    const admin = new Wallet(PRIVATE_KEY, provider);
    const solution = new Contract(ASSET_POOL, IDefaultDiamondArtifact.abi, admin);
    const signer = new Wallet(WALLET_PRIVATE_KEY, provider);
    // const { call, nonce, sig } = await signMethod(solution, 'withdrawPollFinalize', [11], signer);

    // console.log(call, nonce, sig);
    // const benef = (await solution.getBeneficiary(11)).toNumber();
    // const id = (await solution.getMemberByAddress(signer.address)).toNumber();
    // console.log(benef, id);

    const tx = await (await solution.withdrawPollFinalize(11)).wait();
    console.log(tx);

    // const res = await parseResultLog(tx.events);
    // console.log(res);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
